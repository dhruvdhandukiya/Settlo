"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Send,
  CheckCircle2,
  Copy,
  ExternalLink,
  RefreshCw,
  Unlink,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";

export function TelegramConnectModal({ open, onOpenChange }) {
  const { data: statusData, isLoading: isStatusLoading } = useConvexQuery(
    api.telegram.getTelegramStatus
  );

  const generateCodeMutation = useConvexMutation(
    api.telegram.generateTelegramLinkingCode
  );
  const unlinkMutation = useConvexMutation(api.telegram.unlinkTelegram);

  const [botUsername, setBotUsername] = useState(
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "my_settlo_bot"
  );
  const [linkDetails, setLinkDetails] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate code on modal open if not connected
  useEffect(() => {
    if (open && !statusData?.isConnected && !linkDetails && !isGenerating) {
      handleGenerateCode();
    }
  }, [open, statusData?.isConnected]);

  // Toast when successfully connected
  useEffect(() => {
    if (statusData?.isConnected && open && linkDetails) {
      toast.success("🎉 Telegram connected to your Settlo account!");
    }
  }, [statusData?.isConnected]);

  const handleGenerateCode = async () => {
    try {
      setIsGenerating(true);
      const res = await generateCodeMutation.mutate({
        botUsername: botUsername.trim() || undefined,
      });
      setLinkDetails(res);
      if (res.botUsername && !botUsername) {
        setBotUsername(res.botUsername);
      }
    } catch (err) {
      toast.error("Could not generate linking code: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = () => {
    const code = linkDetails?.code || statusData?.linkingCode;
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Copied '" + code + "' to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUnlink = async () => {
    try {
      setIsUnlinking(true);
      await unlinkMutation.mutate({});
      toast.success("Telegram disconnected.");
      setLinkDetails(null);
      handleGenerateCode();
    } catch (err) {
      toast.error("Failed to disconnect: " + err.message);
    } finally {
      setIsUnlinking(false);
    }
  };

  const isConnected = statusData?.isConnected;
  const currentCode = linkDetails?.code || statusData?.linkingCode || "";
  const cleanBot = (botUsername || "my_settlo_bot").replace("@", "").trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                Telegram Expense Bot
              </DialogTitle>
              <DialogDescription className="text-xs">
                Log expenses, snap receipts, or record voice memos with zero limits.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Status Badge */}
          <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/30">
            <div className="flex items-center gap-2">
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  isConnected
                    ? "bg-sky-500 animate-pulse"
                    : "bg-amber-500"
                }`}
              />
              <span className="text-xs font-semibold">
                Status: {isConnected ? "Connected" : "Not Linked"}
              </span>
            </div>
            {isConnected ? (
              <Badge
                variant="secondary"
                className="bg-sky-500/10 text-sky-700 dark:text-sky-400 text-[11px] gap-1"
              >
                <CheckCircle2 className="h-3 w-3" />
                {statusData?.telegramUsername ? `@${statusData.telegramUsername}` : "Active"}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[11px]">
                Setup Required
              </Badge>
            )}
          </div>

          {/* Connected State View */}
          {isConnected ? (
            <div className="space-y-4">
              <Card className="border-sky-500/30 bg-gradient-to-b from-sky-500/5 to-transparent">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300 font-semibold text-xs">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Active Telegram Bot Integration</span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    You can now message the bot, upload receipt photos, or send voice notes anytime. Your expenses will be automatically parsed and synced here in real time.
                  </p>

                  <div className="p-2.5 rounded-lg bg-background border space-y-1 text-xs">
                    <span className="font-semibold text-foreground">
                      Example messages to send:
                    </span>
                    <ul className="text-muted-foreground text-[11px] space-y-0.5 list-disc pl-4">
                      <li>"Dinner with Harsh $50, I paid"</li>
                      <li>"Bhai CCD pe 450 gaya, maine pay kiya Harsh aur mera aadha aadha"</li>
                      <li>/balance (to check who owes you)</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isUnlinking}
                  onClick={handleUnlink}
                  className="text-xs text-destructive hover:bg-destructive/10 gap-1.5"
                >
                  <Unlink className="h-3.5 w-3.5" />
                  {isUnlinking ? "Disconnecting..." : "Disconnect Telegram"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onOpenChange?.(false)}
                  className="bg-sky-600 hover:bg-sky-700 text-white text-xs"
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            /* Unlinked State: 1-Tap Connect */
            <div className="space-y-3.5">
              {/* Code Box */}
              <div className="p-3.5 rounded-xl border bg-gradient-to-b from-sky-500/5 to-muted/30 text-center space-y-1.5">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Your One-Time Pairing Code
                </span>
                <div className="text-3xl font-mono font-black tracking-widest text-sky-600 dark:text-sky-400">
                  {isGenerating ? (
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  ) : (
                    currentCode || "------"
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyCode}
                  className="h-7 text-xs gap-1.5 hover:bg-sky-500/10"
                >
                  <Copy className="h-3 w-3" />
                  {copied ? "Copied to Clipboard!" : "Copy Code"}
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  asChild
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold gap-2 shadow-sm h-10"
                >
                  <a
                    href={`https://t.me/${cleanBot}?start=${currentCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Send className="h-4 w-4" />
                    Open @{cleanBot} in Telegram
                    <ExternalLink className="h-3.5 w-3.5 ml-auto" />
                  </a>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="w-full text-xs gap-1.5 h-9"
                >
                  <a
                    href={`https://web.telegram.org/a/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3D${cleanBot}%26start%3D${currentCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open in Telegram Web Browser ↗
                  </a>
                </Button>
              </div>

              {/* Manual Direct Instructions */}
              <div className="p-3 rounded-xl bg-muted/40 border text-xs space-y-1 text-muted-foreground">
                <div className="font-semibold text-foreground text-[11px] flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-sky-600" />
                  Manual Connect in 2 Steps:
                </div>
                <ol className="list-decimal pl-4 space-y-1 text-[11px]">
                  <li>
                    In Telegram, search for: <strong className="text-foreground">@{cleanBot}</strong>
                  </li>
                  <li>
                    Send your code: <strong className="text-sky-600 font-mono">{currentCode || "YOUR_CODE"}</strong> (or tap Start)
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
