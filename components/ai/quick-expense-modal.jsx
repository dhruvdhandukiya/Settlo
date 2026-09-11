"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  Receipt,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UploadCloud,
  X,
  ArrowRight,
  RefreshCw,
  Edit3,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";
import { getCategoryById, getCategoryIcon } from "@/lib/expense-categories";
import { ReceiptItemAssigner } from "./receipt-item-assigner";

const MAX_TEXT_LENGTH = 500;

export function QuickExpenseModal({ open, onOpenChange }) {
  const router = useRouter();

  // Queries & Mutations
  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);
  const { data: contactsData } = useConvexQuery(api.contacts.getAllContacts);
  const createExpense = useConvexMutation(api.expenses.createExpense);

  const contacts = contactsData?.users || [];
  const groups = contactsData?.groups || [];

  // Local state
  const [activeTab, setActiveTab] = useState("text");
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isPending, startTransition] = useTransition();

  // State machine: 'input' | 'clarification' | 'receipt_matrix' | 'proposal' | 'error'
  const [stage, setStage] = useState("input");
  const [proposal, setProposal] = useState(null);
  const [receiptAnalysis, setReceiptAnalysis] = useState(null);
  const [clarification, setClarification] = useState(null);
  const [clarificationAnswer, setClarificationAnswer] = useState("");
  const [conversationHistory, setConversationHistory] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Quick suggestion chips
  const suggestionChips = [
    {
      label: "Equal Split",
      text: contacts[0]
        ? `Dinner with ${contacts[0].name.split(" ")[0]} $50, I paid`
        : "Dinner with Alex $50, I paid",
    },
    {
      label: "Exact Amounts",
      text: contacts[0]
        ? `Uber $30, ${contacts[0].name.split(" ")[0]} owes 20 and I owe 10`
        : "Uber $30, Alex owes 20 and I owe 10",
    },
    {
      label: "Percentage Split",
      text: contacts[0]
        ? `Groceries $100, 60/40 between me and ${contacts[0].name.split(" ")[0]}`
        : "Groceries $100, 60/40 between me and Alex",
    },
  ];

  // Return to input stage while preserving prompt text and file attachments
  const handleEditPrompt = () => {
    setStage("input");
    setProposal(null);
    setReceiptAnalysis(null);
    setClarification(null);
    setClarificationAnswer("");
    setConversationHistory([]);
    setErrorMessage(null);
    setIsSaving(false);
  };

  // Full reset modal state (on dialog close or successful save)
  const handleReset = () => {
    setStage("input");
    setInputText("");
    setSelectedFile(null);
    setFilePreview(null);
    setProposal(null);
    setReceiptAnalysis(null);
    setClarification(null);
    setClarificationAnswer("");
    setConversationHistory([]);
    setErrorMessage(null);
    setIsSaving(false);
  };

  const handleOpenChange = (newOpen) => {
    if (!newOpen) {
      handleReset();
    }
    onOpenChange?.(newOpen);
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (JPEG, PNG, WEBP, HEIC)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setFilePreview(reader.result);
    reader.readAsDataURL(file);
  };

  // Submit request to API route
  const handleParse = async (overrideText = null, isClarification = false) => {
    const textToSend = overrideText !== null ? overrideText : inputText;

    if (!textToSend.trim() && !selectedFile && !isClarification) {
      toast.error("Please enter a description or upload a receipt photo");
      return;
    }

    setErrorMessage(null);

    startTransition(async () => {
      try {
        const formData = new FormData();

        if (textToSend) {
          formData.append("text", textToSend);
        }

        if (selectedFile) {
          formData.append("image", selectedFile);
        }

        // Pass safe contextual hints
        formData.append("contacts", JSON.stringify(contacts));
        formData.append("groups", JSON.stringify(groups));
        formData.append(
          "conversationHistory",
          JSON.stringify(conversationHistory)
        );

        const res = await fetch("/api/ai/parse-expense", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setStage("error");
          setErrorMessage(
            data.error ||
              "Could not parse expense at this time. Please try again or use the manual form."
          );
          return;
        }

        const result = data.data;

        if (result.type === "clarification_needed") {
          setClarification(result);
          setStage("clarification");
        } else if (result.type === "receipt_analysis") {
          setReceiptAnalysis(result);
          setStage("receipt_matrix");
        } else if (result.type === "expense_proposal") {
          setProposal(result);
          setStage("proposal");
        }
      } catch (err) {
        setStage("error");
        setErrorMessage(
          "Network error connecting to AI parser. Please check your connection or use manual entry."
        );
      }
    });
  };

  // Handle Clarification Answer Submission
  const handleClarificationSubmit = (e) => {
    e.preventDefault();
    if (!clarificationAnswer.trim()) return;

    const newHistory = [
      ...conversationHistory,
      {
        question: clarification?.question || "",
        answer: clarificationAnswer.trim(),
      },
    ];

    setConversationHistory(newHistory);
    const combinedPrompt = `${inputText} (Clarification: ${clarificationAnswer.trim()})`;
    setClarificationAnswer("");
    handleParse(combinedPrompt, true);
  };

  // Arithmetic sanity check for proposals
  const isSanityCheckPassed = () => {
    if (!proposal || !proposal.splits) return false;
    const totalSplits = proposal.splits.reduce((acc, s) => acc + s.amount, 0);
    return Math.abs(totalSplits - proposal.amount) <= 0.01;
  };

  // Confirm and save expense into Convex
  const handleConfirmSave = async () => {
    if (!proposal || !isSanityCheckPassed()) {
      toast.error("Split calculations do not sum up to total amount.");
      return;
    }

    try {
      setIsSaving(true);

      const formattedSplits = proposal.splits.map((s) => ({
        userId: s.userId,
        amount: s.amount,
        paid: s.paid || s.userId === proposal.paidByUserId,
      }));

      await createExpense.mutate({
        description: proposal.description,
        amount: proposal.amount,
        category: proposal.category || "other",
        date: proposal.date || Date.now(),
        paidByUserId: proposal.paidByUserId || currentUser._id,
        splitType: proposal.splitType || "equal",
        splits: formattedSplits,
        groupId: proposal.groupId || undefined,
      });

      toast.success("Expense saved successfully via AI Assistant!");
      handleOpenChange(false);

      if (proposal.groupId) {
        router.push(`/groups/${proposal.groupId}`);
      } else {
        const otherSplit = proposal.splits.find(
          (s) => s.userId !== currentUser?._id
        );
        if (otherSplit?.userId) {
          router.push(`/person/${otherSplit.userId}`);
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err) {
      toast.error("Failed to save expense: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Prefill transport into full manual form
  const handleOpenInManualForm = () => {
    if (proposal) {
      sessionStorage.setItem("settlo_draft_expense", JSON.stringify(proposal));
    } else if (inputText?.trim()) {
      sessionStorage.setItem(
        "settlo_draft_expense",
        JSON.stringify({
          description: inputText.trim(),
        })
      );
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("settlo_draft_updated"));
    }
    handleOpenChange(false);
    router.push("/expenses/new");
  };

  // Helper to get participant info
  const getParticipantInfo = (userId) => {
    if (userId === currentUser?._id || userId === currentUser?.id) {
      return {
        name: `${currentUser?.name || "You"} (You)`,
        imageUrl: currentUser?.imageUrl,
      };
    }
    const contact = contacts.find((c) => c.id === userId);
    if (contact) return contact;
    return { name: "Participant", imageUrl: null };
  };

  // Get category icon
  const CategoryIconComponent = proposal?.category
    ? getCategoryIcon(proposal.category)
    : Sparkles;

  const categoryObj = proposal?.category
    ? getCategoryById(proposal.category)
    : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-green-500/10 text-green-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                Smart Add with AI
              </DialogTitle>
              <DialogDescription className="text-xs">
                Type natural language or scan a receipt photo to generate split
                expenses instantly.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ─── STAGE: INPUT ─── */}
        {stage === "input" && (
          <div className="space-y-5 pt-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="text" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Natural Text
                </TabsTrigger>
                <TabsTrigger value="receipt" className="gap-2">
                  <Receipt className="h-4 w-4" />
                  Receipt Scan
                </TabsTrigger>
              </TabsList>

              {/* Tab: Natural Text */}
              <TabsContent value="text" className="space-y-4 pt-3">
                <div className="space-y-2">
                  <div className="relative">
                    <Textarea
                      placeholder="e.g., Paid $60 for sushi with Sarah, split equally"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      maxLength={MAX_TEXT_LENGTH}
                      rows={3}
                      className="resize-none pr-14 text-sm"
                    />
                    <span className="absolute bottom-2 right-2.5 text-[10px] text-muted-foreground">
                      {inputText.length}/{MAX_TEXT_LENGTH}
                    </span>
                  </div>
                </div>

                {/* Suggestion Chips */}
                <div className="space-y-2">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Example:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestionChips.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setInputText(chip.text)}
                        className="text-xs px-2.5 py-1 rounded-lg border bg-muted/50 hover:bg-muted hover:border-green-500/40 text-left transition cursor-pointer"
                      >
                        <span className="font-semibold text-green-700 dark:text-green-400 mr-1">
                          {chip.label}:
                        </span>
                        <span>"{chip.text}"</span>
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Tab: Receipt Photo */}
              <TabsContent value="receipt" className="space-y-4 pt-3">
                {!filePreview ? (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-green-500/50 hover:bg-muted/30 transition">
                    <UploadCloud className="h-8 w-8 text-green-600 mb-2" />
                    <span className="text-sm font-medium">
                      Upload or drag receipt photo
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      JPEG, PNG, WEBP, or HEIC (max 10MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative border rounded-xl overflow-hidden p-2 flex items-center justify-between bg-muted/20">
                    <div className="flex items-center gap-3">
                      <img
                        src={filePreview}
                        alt="Receipt preview"
                        className="h-16 w-16 object-cover rounded-lg border"
                      />
                      <div>
                        <div className="font-medium text-xs truncate max-w-[200px]">
                          {selectedFile?.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {(selectedFile?.size / (1024 * 1024)).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreview(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <Input
                  placeholder="Optional note or participants (e.g. Split with Sarah and Alex)"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="text-sm"
                />
              </TabsContent>
            </Tabs>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isPending || (!inputText.trim() && !selectedFile)}
                onClick={() => handleParse()}
                className="bg-green-600 hover:bg-green-700 text-white gap-2"
              >
                {isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Parse Expense
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ─── STAGE: CLARIFICATION ─── */}
        {stage === "clarification" && clarification && (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
              <div className="flex items-center gap-2 text-amber-600 font-semibold text-sm">
                <HelpCircle className="h-4 w-4" />
                <span>AI Needs Clarification</span>
              </div>
              <p className="text-sm text-foreground">
                {clarification.question}
              </p>
            </div>

            <form onSubmit={handleClarificationSubmit} className="space-y-3">
              <Input
                placeholder="Type your response (e.g., Split with Sarah and Alex equally)"
                value={clarificationAnswer}
                onChange={(e) => setClarificationAnswer(e.target.value)}
                autoFocus
                className="text-sm"
              />

              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={handleEditPrompt}
                  className="text-xs"
                >
                  Back to Edit
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    type="submit"
                    disabled={isPending || !clarificationAnswer.trim()}
                    className="bg-green-600 hover:bg-green-700 text-white gap-2"
                  >
                    {isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                    Continue
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ─── STAGE: RECEIPT MATRIX ─── */}
        {stage === "receipt_matrix" && receiptAnalysis && (
          <ReceiptItemAssigner
            receiptData={receiptAnalysis}
            initialParticipants={[
              {
                id: currentUser?._id || currentUser?.id,
                name: currentUser?.name || "You",
                email: currentUser?.email,
                imageUrl: currentUser?.imageUrl,
              },
              ...contacts,
            ]}
            allAvailableContacts={contacts}
            currentUserId={currentUser?._id || currentUser?.id}
            onComplete={(finalProposal) => {
              setProposal(finalProposal);
              setStage("proposal");
            }}
            onCancel={handleEditPrompt}
          />
        )}

        {/* ─── STAGE: PROPOSAL CARD ─── */}
        {stage === "proposal" && proposal && (
          <div className="space-y-5 pt-2">
            <Card className="border-green-600/30 bg-gradient-to-b from-green-500/5 to-transparent">
              <CardContent className="p-5 space-y-4">
                {/* Header: Title & Amount */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold">
                        {proposal.description}
                      </h3>
                      {categoryObj && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <CategoryIconComponent className="h-3 w-3" />
                          {categoryObj.name}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {proposal.reasoning}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      ${proposal.amount.toFixed(2)}
                    </div>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {proposal.splitType} Split
                    </Badge>
                  </div>
                </div>

                {/* Payer info */}
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 text-xs">
                  <span className="text-muted-foreground">Paid by:</span>
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Avatar className="h-5 w-5">
                      <AvatarImage
                        src={
                          getParticipantInfo(proposal.paidByUserId)?.imageUrl
                        }
                      />
                      <AvatarFallback className="text-[10px]">
                        {getParticipantInfo(proposal.paidByUserId)
                          ?.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span>
                      {getParticipantInfo(proposal.paidByUserId)?.name}
                    </span>
                  </div>
                </div>

                {/* Split Breakdown */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Split Breakdown
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {proposal.splits.map((s, idx) => {
                      const pInfo = getParticipantInfo(s.userId);
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-lg border bg-background text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={pInfo?.imageUrl} />
                              <AvatarFallback className="text-[10px]">
                                {pInfo?.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{pInfo?.name}</span>
                          </div>
                          <div className="font-bold">
                            ${s.amount.toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Confidence indicator */}
                <div className="flex items-center justify-between text-[11px] pt-1 text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    <span>
                      Confidence: {Math.round((proposal.confidence || 0.9) * 100)}%
                    </span>
                  </div>
                  {proposal.confidence < 0.8 && (
                    <span className="text-amber-600">
                      Please double-check split details
                    </span>
                  )}
                </div>

                {/* Sanity check warning */}
                {!isSanityCheckPassed() && (
                  <div className="flex items-center gap-2 text-xs text-red-600 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>
                      Split amounts do not equal total. Please adjust via manual
                      form.
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Proposal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  type="button"
                  size="sm"
                  onClick={handleEditPrompt}
                  className="gap-1.5 text-xs w-1/2 sm:w-auto"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit Prompt
                </Button>
                <Button
                  variant="ghost"
                  type="button"
                  size="sm"
                  onClick={handleOpenInManualForm}
                  className="gap-1.5 text-xs w-1/2 sm:w-auto"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open in Manual Form
                </Button>
              </div>

              <Button
                type="button"
                disabled={!isSanityCheckPassed() || isSaving}
                onClick={handleConfirmSave}
                className="bg-green-600 hover:bg-green-700 text-white gap-2 w-full sm:w-auto"
              >
                {isSaving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Confirm & Save Expense
              </Button>
            </div>
          </div>
        )}

        {/* ─── STAGE: ERROR FALLBACK ─── */}
        {stage === "error" && (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 space-y-2">
              <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>AI Service Unavailable</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {errorMessage ||
                  "We could not process your expense at this time."}
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <Button variant="outline" type="button" onClick={handleEditPrompt}>
                Edit & Try Again
              </Button>
              <Button
                type="button"
                onClick={handleOpenInManualForm}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Use Manual Form
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
