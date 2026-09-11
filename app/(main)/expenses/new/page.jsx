"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ExpenseForm } from "./components/expense-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { QuickExpenseModal } from "@/components/ai/quick-expense-modal";

export default function NewExpensePage() {
  const router = useRouter();
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("individual");

  useEffect(() => {
    const checkDraft = () => {
      if (typeof window === "undefined") return;
      try {
        const rawDraft = sessionStorage.getItem("settlo_draft_expense");
        if (rawDraft) {
          const draft = JSON.parse(rawDraft);
          if (draft.groupId) {
            setActiveTab("group");
          } else {
            setActiveTab("individual");
          }
        }
      } catch (e) {
        console.warn("Could not read draft from sessionStorage:", e);
      }
    };

    checkDraft();
    window.addEventListener("settlo_draft_updated", checkDraft);
    return () => {
      window.removeEventListener("settlo_draft_updated", checkDraft);
    };
  }, []);

  return (
    <div className="container max-w-3xl mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-5xl gradient-title">Add a new expense</h1>
          <p className="text-muted-foreground mt-1">
            Record a new expense to split with others
          </p>
        </div>
        <Button
          onClick={() => setIsAiModalOpen(true)}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Smart Add with AI
        </Button>
      </div>

      <QuickExpenseModal
        open={isAiModalOpen}
        onOpenChange={setIsAiModalOpen}
      />

      <Card>
        <CardContent>
          <Tabs
            className="pb-3"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="individual">Individual Expense</TabsTrigger>
              <TabsTrigger value="group">Group Expense</TabsTrigger>
            </TabsList>
            <TabsContent value="individual" className="mt-0">
              {activeTab === "individual" && (
                <ExpenseForm
                  type="individual"
                  onSuccess={(id) => router.push(`/person/${id}`)}
                />
              )}
            </TabsContent>
            <TabsContent value="group" className="mt-0">
              {activeTab === "group" && (
                <ExpenseForm
                  type="group"
                  onSuccess={(id) => router.push(`/groups/${id}`)}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
