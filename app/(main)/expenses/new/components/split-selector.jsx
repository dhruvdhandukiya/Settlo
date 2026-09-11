"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Scale } from "lucide-react";

export function SplitSelector({
  type = "equal",
  amount = 0,
  participants = [],
  paidByUserId,
  initialSplits,
  onSplitsChange,
}) {
  const { user } = useUser();
  const [splits, setSplits] = useState([]);
  const [totalPercentage, setTotalPercentage] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  const appliedInitialSplitsRef = useState({ current: null })[0];

  useEffect(() => {
    if (!participants || participants.length === 0) {
      setSplits([]);
      setTotalAmount(0);
      setTotalPercentage(0);
      return;
    }

    let newSplits = [];
    const isNewInitialSplits =
      initialSplits &&
      initialSplits.length > 0 &&
      appliedInitialSplitsRef.current !== initialSplits;

    if (isNewInitialSplits) {
      appliedInitialSplitsRef.current = initialSplits;

      // Prefill splits from AI proposal
      newSplits = participants.map((participant) => {
        const init = initialSplits.find((s) => s.userId === participant.id);
        let shareAmount = 0;
        let sharePercentage = 0;

        if (init) {
          shareAmount = init.amount ?? 0;
          sharePercentage =
            init.percentage !== undefined
              ? init.percentage
              : amount > 0
              ? (shareAmount / amount) * 100
              : 100 / participants.length;
        } else {
          shareAmount = amount / participants.length;
          sharePercentage = 100 / participants.length;
        }

        return {
          userId: participant.id,
          name: participant.name,
          email: participant.email,
          imageUrl: participant.imageUrl,
          amount: shareAmount,
          percentage: Math.round(sharePercentage * 10) / 10,
          paid: participant.id === paidByUserId,
        };
      });
    } else if (type === "equal") {
      // Equal splits
      const shareAmount = amount / participants.length;
      const sharePercentage = Math.round((100 / participants.length) * 10) / 10;
      newSplits = participants.map((participant) => ({
        userId: participant.id,
        name: participant.name,
        email: participant.email,
        imageUrl: participant.imageUrl,
        amount: shareAmount,
        percentage: sharePercentage,
        paid: participant.id === paidByUserId,
      }));
    } else if (type === "percentage") {
      // Maintain existing percentages or initialize evenly
      newSplits = participants.map((participant) => {
        const existing = splits.find((s) => s.userId === participant.id);
        const evenPercentage =
          Math.round((100 / participants.length) * 10) / 10;
        const perc = existing ? existing.percentage : evenPercentage;
        return {
          userId: participant.id,
          name: participant.name,
          email: participant.email,
          imageUrl: participant.imageUrl,
          amount: (amount * perc) / 100,
          percentage: perc,
          paid: participant.id === paidByUserId,
        };
      });
    } else if (type === "exact") {
      // Maintain existing exact amounts or initialize evenly
      newSplits = participants.map((participant) => {
        const existing = splits.find((s) => s.userId === participant.id);
        const evenAmount = amount / participants.length;
        const amt = existing ? existing.amount : evenAmount;
        return {
          userId: participant.id,
          name: participant.name,
          email: participant.email,
          imageUrl: participant.imageUrl,
          amount: amt,
          percentage: amount > 0 ? (amt / amount) * 100 : 0,
          paid: participant.id === paidByUserId,
        };
      });
    }

    setSplits(newSplits);

    // Calculate totals
    const newTotalAmount = newSplits.reduce(
      (sum, split) => sum + split.amount,
      0
    );
    const newTotalPercentage = newSplits.reduce(
      (sum, split) => sum + split.percentage,
      0
    );

    setTotalAmount(newTotalAmount);
    setTotalPercentage(newTotalPercentage);

    if (onSplitsChange) {
      onSplitsChange(newSplits);
    }
  }, [type, amount, participants, paidByUserId, initialSplits]);

  // Smart percentage update with automatic rebalancing
  const updatePercentageSplit = (userId, newPercentage) => {
    const clamped = Math.max(
      0,
      Math.min(100, Math.round(newPercentage * 10) / 10)
    );

    if (splits.length <= 1) {
      const updatedSplits = splits.map((s) => ({
        ...s,
        percentage: 100,
        amount: amount,
      }));
      setSplits(updatedSplits);
      setTotalAmount(amount);
      setTotalPercentage(100);
      if (onSplitsChange) onSplitsChange(updatedSplits);
      return;
    }

    if (splits.length === 2) {
      // 2-person split: perfectly complementary (A + B = 100%)
      const otherPercentage =
        Math.round(Math.max(0, 100 - clamped) * 10) / 10;
      const updatedSplits = splits.map((s) => {
        if (s.userId === userId) {
          return {
            ...s,
            percentage: clamped,
            amount: (amount * clamped) / 100,
          };
        } else {
          return {
            ...s,
            percentage: otherPercentage,
            amount: (amount * otherPercentage) / 100,
          };
        }
      });

      setSplits(updatedSplits);
      const newTotalAmount = updatedSplits.reduce(
        (sum, s) => sum + s.amount,
        0
      );
      const newTotalPercentage = updatedSplits.reduce(
        (sum, s) => sum + s.percentage,
        0
      );
      setTotalAmount(newTotalAmount);
      setTotalPercentage(newTotalPercentage);
      if (onSplitsChange) onSplitsChange(updatedSplits);
      return;
    }

    // 3+ person split: proportionally distribute (100 - clamped) among other participants
    const remainingPercentage = Math.max(0, 100 - clamped);
    const otherSplits = splits.filter((s) => s.userId !== userId);
    const sumOthers = otherSplits.reduce((sum, s) => sum + s.percentage, 0);

    let recalculatedOthers = [];
    let allocated = 0;

    if (sumOthers > 0) {
      recalculatedOthers = otherSplits.map((s, idx) => {
        if (idx === otherSplits.length - 1) {
          const sharePerc =
            Math.round(Math.max(0, remainingPercentage - allocated) * 10) / 10;
          return {
            ...s,
            percentage: sharePerc,
            amount: (amount * sharePerc) / 100,
          };
        }
        const ratio = s.percentage / sumOthers;
        const sharePerc =
          Math.round(remainingPercentage * ratio * 10) / 10;
        allocated += sharePerc;
        return {
          ...s,
          percentage: sharePerc,
          amount: (amount * sharePerc) / 100,
        };
      });
    } else {
      const equalShare =
        Math.round((remainingPercentage / otherSplits.length) * 10) / 10;
      recalculatedOthers = otherSplits.map((s, idx) => {
        if (idx === otherSplits.length - 1) {
          const sharePerc =
            Math.round(Math.max(0, remainingPercentage - allocated) * 10) / 10;
          return {
            ...s,
            percentage: sharePerc,
            amount: (amount * sharePerc) / 100,
          };
        }
        allocated += equalShare;
        return {
          ...s,
          percentage: equalShare,
          amount: (amount * equalShare) / 100,
        };
      });
    }

    const updatedSplits = splits.map((s) => {
      if (s.userId === userId) {
        return {
          ...s,
          percentage: clamped,
          amount: (amount * clamped) / 100,
        };
      }
      return (
        recalculatedOthers.find((o) => o.userId === s.userId) || s
      );
    });

    setSplits(updatedSplits);
    const newTotalAmount = updatedSplits.reduce(
      (sum, s) => sum + s.amount,
      0
    );
    const newTotalPercentage = updatedSplits.reduce(
      (sum, s) => sum + s.percentage,
      0
    );
    setTotalAmount(newTotalAmount);
    setTotalPercentage(newTotalPercentage);

    if (onSplitsChange) {
      onSplitsChange(updatedSplits);
    }
  };

  // Smart exact amount update
  const updateExactSplit = (userId, newAmount) => {
    const parsedAmount = Math.max(0, parseFloat(newAmount) || 0);

    if (splits.length === 2 && amount > 0 && parsedAmount <= amount) {
      // For 2-person exact split, auto-calculate other person's share
      const remainingAmount = Math.round((amount - parsedAmount) * 100) / 100;
      const updatedSplits = splits.map((s) => {
        if (s.userId === userId) {
          return {
            ...s,
            amount: parsedAmount,
            percentage: (parsedAmount / amount) * 100,
          };
        } else {
          return {
            ...s,
            amount: remainingAmount,
            percentage: (remainingAmount / amount) * 100,
          };
        }
      });

      setSplits(updatedSplits);
      setTotalAmount(amount);
      setTotalPercentage(100);
      if (onSplitsChange) onSplitsChange(updatedSplits);
      return;
    }

    const updatedSplits = splits.map((split) => {
      if (split.userId === userId) {
        return {
          ...split,
          amount: parsedAmount,
          percentage: amount > 0 ? (parsedAmount / amount) * 100 : 0,
        };
      }
      return split;
    });

    setSplits(updatedSplits);
    const newTotalAmount = updatedSplits.reduce(
      (sum, split) => sum + split.amount,
      0
    );
    const newTotalPercentage = updatedSplits.reduce(
      (sum, split) => sum + split.percentage,
      0
    );

    setTotalAmount(newTotalAmount);
    setTotalPercentage(newTotalPercentage);

    if (onSplitsChange) {
      onSplitsChange(updatedSplits);
    }
  };

  // Auto-distribute remaining unallocated amount in exact mode
  const handleAutoDistributeRemaining = () => {
    if (splits.length === 0 || amount <= 0) return;
    const currentAllocated = splits.reduce((sum, s) => sum + s.amount, 0);
    const delta = amount - currentAllocated;

    if (Math.abs(delta) < 0.01) return;

    // Distribute delta evenly across all splits
    const addPerPerson = Math.round((delta / splits.length) * 100) / 100;
    let distributed = 0;

    const updatedSplits = splits.map((s, idx) => {
      if (idx === splits.length - 1) {
        const finalAmt = Math.max(
          0,
          Math.round((s.amount + (delta - distributed)) * 100) / 100
        );
        return {
          ...s,
          amount: finalAmt,
          percentage: amount > 0 ? (finalAmt / amount) * 100 : 0,
        };
      }
      const newAmt = Math.max(
        0,
        Math.round((s.amount + addPerPerson) * 100) / 100
      );
      distributed += newAmt - s.amount;
      return {
        ...s,
        amount: newAmt,
        percentage: amount > 0 ? (newAmt / amount) * 100 : 0,
      };
    });

    setSplits(updatedSplits);
    setTotalAmount(amount);
    setTotalPercentage(100);
    if (onSplitsChange) onSplitsChange(updatedSplits);
  };

  // Reset to equal split
  const handleResetToEqual = () => {
    if (splits.length === 0 || amount <= 0) return;
    const shareAmount = amount / splits.length;
    const sharePercentage = Math.round((100 / splits.length) * 10) / 10;
    const updatedSplits = splits.map((s) => ({
      ...s,
      amount: shareAmount,
      percentage: sharePercentage,
    }));

    setSplits(updatedSplits);
    setTotalAmount(amount);
    setTotalPercentage(100);
    if (onSplitsChange) onSplitsChange(updatedSplits);
  };

  const isPercentageValid = Math.abs(totalPercentage - 100) < 0.2;
  const isAmountValid = Math.abs(totalAmount - amount) < 0.02;
  const amountDifference = amount - totalAmount;

  return (
    <div className="space-y-4 mt-3">
      {/* Quick Action Bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
        <span className="font-medium">
          {type === "percentage"
            ? "Drag slider or enter %"
            : type === "exact"
            ? "Enter dollar amounts per person"
            : "Equal split among all members"}
        </span>
        {type !== "equal" && (
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={handleResetToEqual}
            className="h-6 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
          >
            <Scale className="h-3 w-3" />
            Reset to Equal
          </Button>
        )}
      </div>

      {/* Participant Split Rows */}
      {splits.map((split) => (
        <div
          key={split.userId}
          className="flex items-center justify-between gap-4 p-2 rounded-lg bg-muted/20 border"
        >
          <div className="flex items-center gap-2 min-w-[130px]">
            <Avatar className="h-7 w-7">
              <AvatarImage src={split.imageUrl} />
              <AvatarFallback>{split.name?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-xs font-semibold truncate max-w-[100px]">
                {split.userId === user?.id ? "You" : split.name}
              </span>
              {split.paid && (
                <span className="text-[10px] text-green-600 font-medium">
                  Paid bill
                </span>
              )}
            </div>
          </div>

          {type === "equal" && (
            <div className="text-right text-xs">
              <span className="font-bold text-sm">
                ${split.amount.toFixed(2)}
              </span>
              <span className="text-muted-foreground ml-1.5">
                ({split.percentage.toFixed(1)}%)
              </span>
            </div>
          )}

          {type === "percentage" && (
            <div className="flex items-center gap-3 flex-1">
              <Slider
                value={[split.percentage]}
                min={0}
                max={100}
                step={1}
                onValueChange={(values) =>
                  updatePercentageSplit(split.userId, values[0])
                }
                className="flex-1"
              />
              <div className="flex items-center gap-2 min-w-[145px] justify-end">
                <div className="relative flex items-center">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={split.percentage}
                    onChange={(e) =>
                      updatePercentageSplit(
                        split.userId,
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-20 h-8 text-xs font-semibold pr-5 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute right-2 text-[11px] text-muted-foreground pointer-events-none">
                    %
                  </span>
                </div>
                <span className="text-xs font-bold text-foreground min-w-[55px] text-right">
                  ${split.amount.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {type === "exact" && (
            <div className="flex items-center gap-2 flex-1 justify-end">
              <div className="relative flex items-center">
                <span className="absolute left-2.5 text-xs text-muted-foreground pointer-events-none">
                  $
                </span>
                <Input
                  type="number"
                  min="0"
                  max={amount * 2}
                  step="0.01"
                  value={split.amount}
                  onChange={(e) =>
                    updateExactSplit(split.userId, e.target.value)
                  }
                  className="w-28 h-8 pl-6 text-xs font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <span className="text-xs text-muted-foreground min-w-[45px] text-right">
                ({split.percentage.toFixed(1)}%)
              </span>
            </div>
          )}
        </div>
      ))}

      {/* Total row with live balance status */}
      <div className="flex items-center justify-between border-t pt-3 mt-3 px-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">Total Split</span>
          {!isAmountValid || !isPercentageValid ? (
            <Badge
              variant="secondary"
              className="bg-amber-500/10 text-amber-700 dark:text-amber-400 gap-1 text-[11px]"
            >
              <AlertCircle className="h-3 w-3" />
              {amountDifference > 0
                ? `$${amountDifference.toFixed(2)} remaining`
                : `$${Math.abs(amountDifference).toFixed(2)} over total`}
            </Badge>
          ) : null}
        </div>

        <div className="text-right">
          <span
            className={`font-bold text-sm ${
              !isAmountValid ? "text-amber-600" : "text-green-600"
            }`}
          >
            ${totalAmount.toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground ml-1.5">
            / ${amount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Helper when exact amounts don't sum up */}
      {type === "exact" && !isAmountValid && (
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              {amountDifference > 0
                ? `$${amountDifference.toFixed(
                    2
                  )} has not been allocated to any participant.`
                : `Total split exceeds bill amount by $${Math.abs(
                    amountDifference
                  ).toFixed(2)}.`}
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAutoDistributeRemaining}
            className="h-7 text-xs border-amber-500/30 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 ml-2"
          >
            Auto-Balance
          </Button>
        </div>
      )}
    </div>
  );
}
