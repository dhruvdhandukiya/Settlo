import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const CANDIDATE_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

export async function POST(req) {
  try {
    const body = await req.json();
    const text = body.text;

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { success: false, error: "Prompt text is required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "GEMINI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const prompt = `
You are an expert AI expense-splitting engine for Settlo.
Analyze the following natural language expense description in English, Hindi, Hinglish, or any combination:
"${text.trim()}"

Extract and return ONLY a valid JSON object matching this schema:
{
  "description": "Short clean expense title (e.g., Flight Ticket, CCD Cafe Coffee, Airbnb Villa, Pizza Party)",
  "amount": 700.0,
  "payer": "Name of the person who paid (e.g., Dhruv, Alex, Sam, You). If 'I', 'me', 'maine', use 'You'",
  "category": "One of: Food & Drink, Transportation, Trips & Stays, Housing & Utilities, Entertainment, General",
  "splits": [
    {
      "name": "Person Name",
      "amount": 350.0,
      "isPayer": true,
      "status": "Paid Total"
    },
    {
      "name": "Person Name",
      "amount": 350.0,
      "isPayer": false,
      "status": "Owes [Payer Name]"
    }
  ]
}

CRITICAL RULES:
1. ONLY extract REAL PEOPLE as participants in the "splits" array. NEVER include phrases like "total amount paid", "ticket book", "bill", "kiya", "paid", or numbers as a person's name!
2. If text specifies "split between dhruv and aayush", participants MUST BE ONLY Dhruv and Aayush. Do NOT add "You" or other random friends unless explicitly stated in the text.
3. If "I", "me", "maine", "my" is mentioned, represent that person as "You".
4. The sum of all "amount" values in the "splits" array MUST EXACTLY equal the total "amount".
5. Set "isPayer: true" for the person who paid, and "status: 'Paid Total'". For other participants, set "status" to "Owes [Payer]" (or "You Owe [Payer]" if the participant is "You").
6. Output raw JSON ONLY.
`.trim();

    let lastError = null;

    for (const modelName of CANDIDATE_MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        if (responseText) {
          const parsed = JSON.parse(responseText);
          if (parsed && parsed.amount && Array.isArray(parsed.splits) && parsed.splits.length > 0) {
            return NextResponse.json({ success: true, data: parsed });
          }
        }
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error("Failed to parse prompt with Gemini");
  } catch (error) {
    console.error("Error in parse-public route:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to parse" },
      { status: 500 }
    );
  }
}
