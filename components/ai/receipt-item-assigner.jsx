"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Users,
  Receipt,
  ArrowRight,
  Sparkles,
  AlertCircle,
  UserPlus,
  CreditCard,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

/**
 * Interactive Receipt Item Assignment Matrix
 * @param {Object} props
 * @param {Object} props.receiptData - Parsed receipt data { merchantName, totalAmount, tax, tip, category, suggestedPayerUserId, suggestedParticipantUserIds, lineItems }
 * @param {Array} props.initialParticipants - List of available participants [{ id, name, email, imageUrl }]
 * @param {Array} props.allAvailableContacts - Full list of all registered contacts to add from
 * @param {string} props.currentUserId - Authenticated user ID
 * @param {Function} props.onComplete - Callback returning the finalized expense_proposal
 * @param {Function} props.onCancel - Callback to cancel or go back
 */
export function ReceiptItemAssigner({
  receiptData,
  initialParticipants = [],
  allAvailableContacts = [],
  currentUserId,
  onComplete,
  onCancel,
}) {
  const { formatAmount } = useCurrency();
  const lineItems = receiptData.lineItems || [];
  const tax = receiptData.tax || 0;
  const tip = receiptData.tip || 0;
  const totalAmount = receiptData.totalAmount || 0;

  // Active participants at the table
  const [activeParticipants, setActiveParticipants] = useState(() => {
    const list = [...initialParticipants];
    // If receiptData has suggested participants, ensure they are in activeParticipants
    if (Array.isArray(receiptData.suggestedParticipantUserIds)) {
      receiptData.suggestedParticipantUserIds.forEach((pId) => {
        if (!list.some((p) => p.id === pId)) {
          const found = allAvailableContacts.find((c) => c.id === pId);
          if (found) list.push(found);
        }
      });
    }
    return list;
  });

  // Selected payer (defaults to suggested payer if detected, otherwise current user)
  const [selectedPayerId, setSelectedPayerId] = useState(() => {
    if (receiptData.suggestedPayerUserId) {
      return receiptData.suggestedPayerUserId;
    }
    return currentUserId;
  });

  // Search popover state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Track assignments: { [itemId]: [userId1, userId2, ...] }
  const [assignments, setAssignments] = useState(() => {
    const initial = {};
    const defaultIds = activeParticipants.map((p) => p.id);
    lineItems.forEach((item) => {
      initial[item.id] = defaultIds.length > 0 ? [...defaultIds] : [];
    });
    return initial;
  });

  // Keep assignments updated when participants are added
  const addParticipantToMeal = (user) => {
    if (activeParticipants.some((p) => p.id === user.id)) return;
    const next = [...activeParticipants, user];
    setActiveParticipants(next);

    // Auto add to items if they had all participants
    setAssignments((prev) => {
      const updated = { ...prev };
      lineItems.forEach((item) => {
        const current = updated[item.id] || [];
        if (current.length === activeParticipants.length) {
          updated[item.id] = [...current, user.id];
        }
      });
      return updated;
    });

    setIsAddUserOpen(false);
    setSearchQuery("");
  };

  // Toggle a participant on a specific item
  const toggleParticipant = (itemId, userId) => {
    setAssignments((prev) => {
      const current = prev[itemId] || [];
      const exists = current.includes(userId);
      const next = exists
        ? current.filter((id) => id !== userId)
        : [...current, userId];
      return { ...prev, [itemId]: next };
    });
  };

  // Assign item to EVERYONE
  const assignToAll = (itemId) => {
    setAssignments((prev) => ({
      ...prev,
      [itemId]: activeParticipants.map((p) => p.id),
    }));
  };

  // Compute breakdowns and splits with proportional tax and tip
  const { participantTotals, unassignedItemsCount, itemsSubtotal } = useMemo(() => {
    let subtotal = 0;
    let unassigned = 0;
    const subtotalsByParticipant = {};

    activeParticipants.forEach((p) => {
      subtotalsByParticipant[p.id] = 0;
    });

    lineItems.forEach((item) => {
      subtotal += item.amount;
      const assigned = assignments[item.id] || [];
      if (assigned.length === 0) {
        unassigned++;
      } else {
        const splitAmount = item.amount / assigned.length;
        assigned.forEach((uId) => {
          if (subtotalsByParticipant[uId] !== undefined) {
            subtotalsByParticipant[uId] += splitAmount;
          }
        });
      }
    });

    // Distribute tax and tip proportionally
    const results = {};
    const effectiveSubtotal = subtotal > 0 ? subtotal : 1;

    activeParticipants.forEach((p) => {
      const pSubtotal = subtotalsByParticipant[p.id] || 0;
      const ratio = pSubtotal / effectiveSubtotal;
      const pTax = Math.round(tax * ratio * 100) / 100;
      const pTip = Math.round(tip * ratio * 100) / 100;
      const pTotal = Math.round((pSubtotal + pTax + pTip) * 100) / 100;

      results[p.id] = {
        subtotal: Math.round(pSubtotal * 100) / 100,
        tax: pTax,
        tip: pTip,
        total: pTotal,
      };
    });

    return {
      participantTotals: results,
      unassignedItemsCount: unassigned,
      itemsSubtotal: subtotal,
    };
  }, [lineItems, assignments, activeParticipants, tax, tip]);

  // Complete assignment and generate proposal
  const handleFinalize = () => {
    const splits = activeParticipants.map((p) => {
      const share = participantTotals[p.id]?.total || 0;
      return {
        userId: p.id,
        amount: share,
        paid: p.id === selectedPayerId,
      };
    });

    // Ensure sum matches total
    const splitsSum = splits.reduce((sum, s) => sum + s.amount, 0);
    const diff = Math.round((totalAmount - splitsSum) * 100) / 100;
    if (Math.abs(diff) > 0 && splits.length > 0) {
      splits[splits.length - 1].amount =
        Math.round((splits[splits.length - 1].amount + diff) * 100) / 100;
    }

    const payerObj = activeParticipants.find((p) => p.id === selectedPayerId);
    const payerName = payerObj?.name || "You";

    const proposal = {
      type: "expense_proposal",
      description: receiptData.merchantName
        ? `${receiptData.merchantName} Receipt`
        : "Receipt Expense",
      amount: totalAmount,
      category: receiptData.category || "foodDrink",
      date: receiptData.date || Date.now(),
      paidByUserId: selectedPayerId,
      groupId: null,
      splitType: "exact",
      splits,
      reasoning: `${payerName} paid ${formatAmount(totalAmount)} (Tax: ${formatAmount(tax)}, Tip: ${formatAmount(tip)})`,
      confidence: receiptData.confidence || 0.95,
    };

    onComplete(proposal);
  };

  // Contacts available to add that aren't already active
  const availableToAdd = allAvailableContacts.filter(
    (c) => !activeParticipants.some((p) => p.id === c.id)
  );

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-4 bg-muted/40 rounded-xl border border-border/50">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-lg">
              {receiptData.merchantName || "Scanned Receipt"}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Assign each item below to one or more participants
          </p>
        </div>
        <div className="text-right flex sm:flex-col items-center sm:items-end gap-3 sm:gap-0">
          <span className="text-2xl font-bold text-green-600">
            {formatAmount(totalAmount)}
          </span>
          <span className="text-xs text-muted-foreground">
            Tax: {formatAmount(tax)} • Tip: {formatAmount(tip)}
          </span>
        </div>
      </div>

      {/* Payer and Participants Bar */}
      <div className="p-3.5 bg-muted/30 rounded-xl border border-border/50 space-y-3">
        {/* Who Paid */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <CreditCard className="h-3.5 w-3.5 text-green-600" />
            <span>Who paid this bill?</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {activeParticipants.map((p) => {
              const isPayer = p.id === selectedPayerId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPayerId(p.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer border ${
                    isPayer
                      ? "bg-green-600 text-white border-green-600 shadow-sm"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  }`}
                >
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={p.imageUrl} />
                    <AvatarFallback className="text-[9px]">
                      {p.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{p.id === currentUserId ? "You" : p.name}</span>
                  {isPayer && <Check className="h-3 w-3" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Add Participant Search */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
          <span className="text-xs text-muted-foreground">
            Split participants ({activeParticipants.length}):
          </span>

          <Popover open={isAddOpen} onOpenChange={setIsAddOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
              >
                <UserPlus className="h-3 w-3" />
                Add Person
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0" align="end">
              <Command>
                <CommandInput placeholder="Search friends..." className="h-8 text-xs" />
                <CommandList>
                  <CommandEmpty>No contact found.</CommandEmpty>
                  <CommandGroup>
                    {availableToAdd.map((contact) => (
                      <CommandItem
                        key={contact.id}
                        onSelect={() => addParticipant(contact)}
                        className="flex items-center gap-2 text-xs cursor-pointer"
                      >
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={contact.imageUrl} />
                          <AvatarFallback className="text-[10px]">
                            {contact.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{contact.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Line Items Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span className="font-semibold uppercase tracking-wider text-[11px]">
            Receipt Items ({lineItems.length})
          </span>
          <span className="text-[11px]">
            {unassignedItems.length > 0 ? (
              <span className="text-amber-600 font-medium">
                {unassignedItems.length} item(s) unassigned
              </span>
            ) : (
              <span className="text-green-600 font-medium">
                ✓ All items assigned
              </span>
            )}
          </span>
        </div>

        {lineItems.map((item, idx) => {
          const assignedUserIds = assignments[item.id] || [];

          return (
            <div
              key={item.id || idx}
              className="p-3.5 rounded-xl border bg-card hover:border-green-500/30 transition shadow-sm space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">
                    #{idx + 1}
                  </span>
                  <span>{item.name}</span>
                </div>
                <div className="font-semibold text-sm">
                  {formatAmount(item.amount)}
                </div>
              </div>

              {/* Participant Assignment Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40">
                <div className="flex flex-wrap items-center gap-1.5">
                  {activeParticipants.map((p) => {
                    const isSelected = assignedUserIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleParticipant(item.id, p.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer border ${
                          isSelected
                            ? "bg-green-600 text-white border-green-600 shadow-sm"
                            : "bg-muted text-muted-foreground border-transparent hover:border-border"
                        }`}
                      >
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={p.imageUrl} />
                          <AvatarFallback className="text-[9px]">
                            {p.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{p.id === currentUserId ? "You" : p.name?.split(" ")[0]}</span>
                        {isSelected && <Check className="h-3 w-3" />}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => assignToAll(item.id)}
                    className="hover:text-green-600 underline cursor-pointer"
                  >
                    All
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Calculated Split Summary */}
      <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          Live Participant Shares (Including Tax & Tip)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {activeParticipants.map((p) => {
            const share = participantTotals[p.id] || { subtotal: 0, total: 0 };
            return (
              <div
                key={p.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-background border border-border/50 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={p.imageUrl} />
                    <AvatarFallback className="text-xs">
                      {p.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-xs leading-none">
                      {p.id === currentUserId ? `${p.name} (You)` : p.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Items: {formatAmount(share.subtotal)}
                    </div>
                  </div>
                </div>
                <div className="font-bold text-sm text-green-600">
                  {formatAmount(share.total)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Button variant="outline" type="button" onClick={onCancel}>
          Back
        </Button>
        <Button
          type="button"
          onClick={handleFinalize}
          className="bg-green-600 hover:bg-green-700 text-white gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Generate Proposal
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
