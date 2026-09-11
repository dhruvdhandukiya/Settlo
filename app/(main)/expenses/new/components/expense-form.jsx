"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ParticipantSelector } from "./participant-selector";
import { GroupSelector } from "./group-selector";
import { CategorySelector } from "./category-selector";
import { SplitSelector } from "./split-selector";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { getAllCategories } from "@/lib/expense-categories";
import { useCurrency } from "@/components/providers/currency-context";

// Form schema validation
const expenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be a positive number",
    }),
  category: z.string().optional(),
  date: z.date(),
  paidByUserId: z.string().min(1, "Payer is required"),
  splitType: z.enum(["equal", "percentage", "exact"]),
  groupId: z.string().optional(),
});

export function ExpenseForm({ type = "individual", onSuccess }) {
  const { currencySymbol, formatAmount } = useCurrency();
  const [participants, setParticipants] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [splits, setSplits] = useState([]);
  const [initialDraftSplits, setInitialDraftSplits] = useState(null);

  // Mutations and queries
  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);
  const { data: contactsData } = useConvexQuery(api.contacts.getAllContacts);

  const createExpense = useConvexMutation(api.expenses.createExpense);
  const categories = getAllCategories();

  // Set up form with validation
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: "",
      category: "",
      date: new Date(),
      paidByUserId: currentUser?._id || "",
      splitType: "equal",
      groupId: undefined,
    },
  });

  // Watch for changes
  const amountValue = watch("amount");
  const paidByUserId = watch("paidByUserId");
  const splitTypeValue = watch("splitType") || "equal";
  const categoryValue = watch("category");
  const groupIdValue = watch("groupId");

  // Restore draft from AI proposal if present
  const loadDraft = React.useCallback(() => {
    if (typeof window === "undefined" || !currentUser) return;
    const rawDraft = sessionStorage.getItem("settlo_draft_expense");
    if (!rawDraft) return;

    try {
      const draft = JSON.parse(rawDraft);

      // If draft has a groupId but this form is individual (or vice versa), ignore
      if (draft.groupId && type === "individual") return;
      if (!draft.groupId && draft.splits?.length > 0 && type === "group") return;

      if (draft.description) setValue("description", draft.description);
      if (draft.amount !== undefined && draft.amount !== null) {
        setValue("amount", draft.amount.toString());
      }
      if (draft.category) setValue("category", draft.category);
      if (draft.date) {
        const d = new Date(draft.date);
        setSelectedDate(d);
        setValue("date", d);
      }
      if (draft.paidByUserId) setValue("paidByUserId", draft.paidByUserId);
      if (draft.splitType) setValue("splitType", draft.splitType);
      if (draft.groupId) setValue("groupId", draft.groupId);

      // Rebuild participants if splits are provided
      if (Array.isArray(draft.splits) && draft.splits.length > 0) {
        const allKnown = [
          {
            id: currentUser._id,
            name: currentUser.name,
            email: currentUser.email,
            imageUrl: currentUser.imageUrl,
          },
          ...(contactsData?.users || []),
        ];

        const seenIds = new Set();
        const restoredParticipants = [];

        // 1. Add participants from splits
        draft.splits.forEach((s) => {
          if (!seenIds.has(s.userId)) {
            seenIds.add(s.userId);
            const match = allKnown.find((k) => k.id === s.userId);
            restoredParticipants.push(
              match || {
                id: s.userId,
                name: "Participant",
                email: "",
                imageUrl: null,
              }
            );
          }
        });

        // 2. Ensure current user is in participants
        if (!seenIds.has(currentUser._id)) {
          restoredParticipants.unshift({
            id: currentUser._id,
            name: currentUser.name,
            email: currentUser.email,
            imageUrl: currentUser.imageUrl,
          });
        }

        // 3. Ensure payer is in participants if specified
        if (draft.paidByUserId && !seenIds.has(draft.paidByUserId)) {
          const payerMatch = allKnown.find((k) => k.id === draft.paidByUserId);
          if (payerMatch) {
            restoredParticipants.push(payerMatch);
          }
        }

        if (restoredParticipants.length > 0) {
          setParticipants(restoredParticipants);
        }

        setInitialDraftSplits(draft.splits);
        setSplits(draft.splits);
      }

      sessionStorage.removeItem("settlo_draft_expense");
      toast.info("Prefilled expense details from AI Assistant draft");
    } catch (err) {
      console.warn("Could not load draft expense from sessionStorage:", err);
    }
  }, [currentUser, contactsData, setValue, type]);

  useEffect(() => {
    loadDraft();
    window.addEventListener("settlo_draft_updated", loadDraft);
    return () => {
      window.removeEventListener("settlo_draft_updated", loadDraft);
    };
  }, [loadDraft]);

  // When a user is added or removed, update the participant list
  useEffect(() => {
    if (participants.length === 0 && currentUser) {
      // Always add the current user as a participant
      setParticipants([
        {
          id: currentUser._id,
          name: currentUser.name,
          email: currentUser.email,
          imageUrl: currentUser.imageUrl,
        },
      ]);
    }
  }, [currentUser, participants]);

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      const amount = parseFloat(data.amount);

      // Prepare splits in the format expected by the API
      const formattedSplits = splits.map((split) => ({
        userId: split.userId,
        amount: split.amount,
        paid: split.userId === data.paidByUserId,
      }));

      // Validate that splits add up to the total (with small tolerance)
      const totalSplitAmount = formattedSplits.reduce(
        (sum, split) => sum + split.amount,
        0
      );
      const tolerance = 0.01;

      if (Math.abs(totalSplitAmount - amount) > tolerance) {
        toast.error(
          `Split amounts don't add up to the total. Please adjust your splits.`
        );
        return;
      }

      // For 1:1 expenses, set groupId to undefined instead of empty string
      const groupId = type === "individual" ? undefined : data.groupId;

      // Create the expense
      await createExpense.mutate({
        description: data.description,
        amount: amount,
        category: data.category || "Other",
        date: data.date.getTime(), // Convert to timestamp
        paidByUserId: data.paidByUserId,
        splitType: data.splitType,
        splits: formattedSplits,
        groupId,
      });

      toast.success("Expense created successfully!");
      reset(); // Reset form

      const otherParticipant = participants.find(
        (p) => p.id !== currentUser._id
      );
      const otherUserId = otherParticipant?.id;

      if (onSuccess) onSuccess(type === "individual" ? otherUserId : groupId);
    } catch (error) {
      toast.error("Failed to create expense: " + error.message);
    }
  };

  if (!currentUser) return null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        {/* Description and amount */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Lunch, movie tickets, etc."
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-sm font-bold text-muted-foreground pointer-events-none">
                {currencySymbol}
              </span>
              <Input
                id="amount"
                placeholder="0.00"
                type="number"
                step="0.01"
                min="0.01"
                className="pl-7 font-semibold"
                {...register("amount")}
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount.message}</p>
            )}
          </div>
        </div>

        {/* Category and date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>

            <CategorySelector
              categories={categories || []}
              value={categoryValue}
              onChange={(categoryId) => {
                if (categoryId) {
                  setValue("category", categoryId);
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setValue("date", date);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Group selector (for group expenses) */}
        {type === "group" && (
          <div className="space-y-2">
            <Label>Group</Label>
            <GroupSelector
              value={groupIdValue}
              onChange={(group) => {
                // Only update if the group has changed to prevent loops
                if (!selectedGroup || selectedGroup.id !== group.id) {
                  setSelectedGroup(group);
                  setValue("groupId", group.id);

                  // Update participants with the group members
                  if (group.members && Array.isArray(group.members)) {
                    // Set the participants once, don't re-set if they're the same
                    setParticipants(group.members);
                  }
                }
              }}
            />
            {!selectedGroup && (
              <p className="text-xs text-amber-600">
                Please select a group to continue
              </p>
            )}
          </div>
        )}

        {/* Participants (for individual expenses) */}
        {type === "individual" && (
          <div className="space-y-2">
            <Label>Participants</Label>
            <ParticipantSelector
              participants={participants}
              onParticipantsChange={setParticipants}
            />
            {participants.length <= 1 && (
              <p className="text-xs text-amber-600">
                Please add at least one other participant
              </p>
            )}
          </div>
        )}

        {/* Paid by selector */}
        <div className="space-y-2">
          <Label>Paid by</Label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register("paidByUserId")}
          >
            <option value="">Select who paid</option>
            {participants.map((participant) => (
              <option key={participant.id} value={participant.id}>
                {participant.id === currentUser._id ? "You" : participant.name}
              </option>
            ))}
          </select>
          {errors.paidByUserId && (
            <p className="text-sm text-red-500">
              {errors.paidByUserId.message}
            </p>
          )}
        </div>

        {/* Split type */}
        <div className="space-y-2">
          <Label>Split type</Label>
          <Tabs
            value={splitTypeValue}
            onValueChange={(value) => setValue("splitType", value)}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="equal">Equal</TabsTrigger>
              <TabsTrigger value="percentage">Percentage</TabsTrigger>
              <TabsTrigger value="exact">Exact Amounts</TabsTrigger>
            </TabsList>
          </Tabs>

          <SplitSelector
            type={splitTypeValue}
            amount={parseFloat(amountValue) || 0}
            participants={participants}
            paidByUserId={paidByUserId}
            initialSplits={initialDraftSplits}
            onSplitsChange={setSplits}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting || participants.length <= 1}
        >
          {isSubmitting ? "Creating..." : "Create Expense"}
        </Button>
      </div>
    </form>
  );
}
