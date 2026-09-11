import { NextResponse } from "next/server";
import { auth, currentUser as getClerkUser } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api.js";
import { parseExpenseWithGemini } from "@/lib/ai/expense-parser.js";

// In-memory sliding window rate limiter (Phase 1 stopgap: 10 requests / min / user)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;
const TIMEOUT_MS = 15000;
const MAX_TEXT_LENGTH = 500;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_MIME_PREFIX = "image/";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

function isRateLimited(userId) {
  const now = Date.now();
  const userTimestamps = rateLimitMap.get(userId) || [];
  const recentTimestamps = userTimestamps.filter(
    (ts) => now - ts < RATE_LIMIT_WINDOW_MS
  );

  if (recentTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitMap.set(userId, recentTimestamps);
    return true;
  }

  recentTimestamps.push(now);
  rateLimitMap.set(userId, recentTimestamps);
  return false;
}

export async function POST(req) {
  try {
    // 1. Server-side Clerk Authentication
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Please sign in to use the AI parsing feature.",
        },
        { status: 401 }
      );
    }

    // 2. Rate Limiting Check
    if (isRateLimited(clerkUserId)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Rate limit exceeded (max 10 requests per minute). Please wait a moment before trying again.",
          fallbackUrl: "/expenses/new",
        },
        { status: 429 }
      );
    }

    // 3. Resolve Authenticated User Server-Side
    let resolvedUser = null;
    try {
      resolvedUser = await convex.query(api.users.getUserByClerkId, {
        clerkUserId,
      });
    } catch (convexErr) {
      console.warn("Could not resolve user via getUserByClerkId:", convexErr);
    }

    if (!resolvedUser) {
      // Fallback to Clerk profile if Convex record is not yet resolved
      const clerkProfile = await getClerkUser();
      resolvedUser = {
        id: clerkUserId,
        name:
          clerkProfile?.fullName ||
          clerkProfile?.firstName ||
          "You",
        email: clerkProfile?.primaryEmailAddress?.emailAddress || "",
      };
    }

    // 4. Parse incoming payload (Multipart Form Data or JSON)
    const contentType = req.headers.get("content-type") || "";
    let text = "";
    let imageBuffer = null;
    let imageMimeType = "image/jpeg";
    let contacts = [];
    let groups = [];
    let conversationHistory = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      text = (formData.get("text") || "").toString();

      const imageFile = formData.get("image");
      if (imageFile && typeof imageFile === "object" && imageFile.size > 0) {
        // File validation
        if (imageFile.size > MAX_FILE_SIZE_BYTES) {
          return NextResponse.json(
            {
              success: false,
              error: "Image exceeds the maximum 10MB size limit.",
              fallbackUrl: "/expenses/new",
            },
            { status: 400 }
          );
        }

        if (!imageFile.type?.startsWith(ALLOWED_IMAGE_MIME_PREFIX)) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid file type. Only image files (JPEG, PNG, WEBP, HEIC) are accepted.",
              fallbackUrl: "/expenses/new",
            },
            { status: 400 }
          );
        }

        imageMimeType = imageFile.type;
        const arrayBuffer = await imageFile.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
      }

      // Context fields (parsed safely)
      const rawContacts = formData.get("contacts");
      if (rawContacts) {
        try {
          contacts = JSON.parse(rawContacts.toString());
        } catch {}
      }

      const rawGroups = formData.get("groups");
      if (rawGroups) {
        try {
          groups = JSON.parse(rawGroups.toString());
        } catch {}
      }

      const rawHistory = formData.get("conversationHistory");
      if (rawHistory) {
        try {
          conversationHistory = JSON.parse(rawHistory.toString());
        } catch {}
      }
    } else {
      // JSON body
      const body = await req.json();
      text = body.text || "";
      contacts = Array.isArray(body.contacts) ? body.contacts : [];
      groups = Array.isArray(body.groups) ? body.groups : [];
      conversationHistory = Array.isArray(body.conversationHistory)
        ? body.conversationHistory
        : [];
    }

    // Fallback: If contacts array is empty, fetch all registered users from Convex
    if (contacts.length === 0) {
      try {
        const allContactsData = await convex.query(api.contacts.getAllContacts);
        contacts = allContactsData?.users || [];
        if (groups.length === 0) {
          groups = allContactsData?.groups || [];
        }
      } catch (err) {
        console.warn("Could not fetch contacts in API route:", err);
      }
    }

    // Text length validation
    if (text && text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          error: `Expense description exceeds the maximum ${MAX_TEXT_LENGTH} character limit.`,
          fallbackUrl: "/expenses/new",
        },
        { status: 400 }
      );
    }

    if (!text && !imageBuffer) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide either an expense description or a receipt photo.",
          fallbackUrl: "/expenses/new",
        },
        { status: 400 }
      );
    }

    // 5. Execute AI parser with timeout guard
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("AI request timed out after 15 seconds")),
        TIMEOUT_MS
      )
    );

    const parserPromise = parseExpenseWithGemini({
      text,
      imageBuffer,
      imageMimeType,
      currentUser: resolvedUser,
      contacts,
      groups,
      conversationHistory,
    });

    const parsedResult = await Promise.race([parserPromise, timeoutPromise]);

    return NextResponse.json({
      success: true,
      data: parsedResult,
    });
  } catch (error) {
    console.error("AI Expense Parsing Route Error:", error);
    const isTimeout =
      error.message?.includes("timed out") || error.name === "TimeoutError";

    return NextResponse.json(
      {
        success: false,
        error: isTimeout
          ? "The AI parsing service timed out. Please try again or enter the expense manually."
          : `AI parsing failed: ${error.message || "Unknown error"}. Use the manual form if the issue persists.`,
        fallbackUrl: "/expenses/new",
      },
      { status: isTimeout ? 504 : 500 }
    );
  }
}
