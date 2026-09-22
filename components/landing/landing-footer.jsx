"use client";

import React, { useState } from "react";
import { Globe, MessageSquare, Send, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/components/providers/currency-context";
import { SettloLogo } from "@/components/settlo-logo";
import { toast } from "sonner";

export function LandingFooter() {
  const { currency, currencySymbol } = useCurrency();
  const [formData, setFormData] = useState({ name: "", contact: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.contact.trim() || !formData.message.trim()) {
      toast.error("Please fill in your name, contact details, and message.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setIsSubmitted(true);
        toast.success("Thank you! Your feedback has been sent to the team.");
        setFormData({ name: "", contact: "", message: "" });
      } else {
        toast.error(data.error || "Could not send feedback. Please try again.");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="w-full border-t border-border/60 bg-muted/20 py-12 px-4 mt-12 text-xs text-muted-foreground">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8 items-start">
        {/* Left Column: Brand Info */}
        <div className="lg:col-span-5 space-y-4">
          <SettloLogo size="default" />
          <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
            The multimodal AI expense engine for trips, roommates, and groups.
          </p>
          <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
            <Globe className="h-3.5 w-3.5 text-emerald-500" />
            <span>Active Currency: <strong className="text-foreground">{currency} ({currencySymbol})</strong></span>
          </div>
        </div>

        {/* Right Column: Customer Feedback & Questions Form */}
        <div className="lg:col-span-7 bg-card/80 dark:bg-card/40 border border-border/70 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-lg">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm mb-1">
            <MessageSquare className="h-4 w-4 text-emerald-500" />
            <span>Have a question, doubt or feedback?</span>
          </div>
          <p className="text-[11px] text-muted-foreground mb-4">
            Send a message directly to the creator. We read and respond to every note!
          </p>

          {isSubmitted ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              <div className="text-xs">
                <strong className="block font-semibold text-foreground">Message Received!</strong>
                Thank you for reaching out. We will get back to you shortly.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  placeholder="Your Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border/80 bg-background/90 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition text-foreground"
                  required
                />
                <input
                  type="text"
                  placeholder="Email or Phone / WhatsApp *"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border/80 bg-background/90 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition text-foreground"
                  required
                />
              </div>

              <textarea
                placeholder="What's on your mind? (e.g., feature request, bug, or general question) *"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border/80 bg-background/90 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition text-foreground resize-none"
                required
              />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs gap-1.5 px-4 h-9 cursor-pointer"
                >
                  {isSubmitting ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>{isSubmitting ? "Sending..." : "Submit Feedback"}</span>
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
        <div>
          © {new Date().getFullYear()} Settlo. Built for frictionless group expense splitting.
        </div>
      </div>
    </footer>
  );
}
