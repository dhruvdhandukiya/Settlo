"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Users,
  Receipt,
  ArrowRight,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  UserPlus,
  CreditCard,
  Trash2,
  Plus,
  Edit2,
  Percent,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  CheckCircle2,
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
import { useCurrency } from "@/components/providers/currency-context";
import { calculateReceiptSplits } from "@/lib/receipt-math";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";

/**
 * Interactive Receipt Item Assignment Matrix
 * @param {Object} props
 * @param {Object} props.receiptData - Parsed receipt data { merchantName, totalAmount, tax, tip, discount, category, suggestedPayerUserId, suggestedParticipantUserIds, lineItems }
 * @param {Array} props.initialParticipants - List of available participants [{ id, name, email, imageUrl }]
 * @param {Array} props.allAvailableContacts - Full list of all registered contacts to add from
 * @param {string} props.currentUserId - Authenticated user ID
 * @param {string} [props.filePreview] - Optional base64 or blob URL of receipt image for zoom preview
 * @param {Function} props.onComplete - Callback returning the finalized expense_proposal
 * @param {Function} props.onCancel - Callback to cancel or go back
 */
export function ReceiptItemAssigner({
  receiptData,
  initialParticipants = [],
  allAvailableContacts = [],
  currentUserId,
  filePreview = null,
  onComplete,
  onCancel,
}) {
  const { formatAmount } = useCurrency();
  const receiptCurrency = receiptData.currency || "INR";
  const fmt = (val) => formatAmount(val, receiptCurrency);

  // 1. Line Items State (supports editing, deleting, and adding)
  const [items, setItems] = useState(() => {
    const raw = receiptData.lineItems || [];
    return raw.map((item, idx) => ({
      id: item.id || `item_${idx}_${Date.now()}`,
      name: item.name || `Item ${idx + 1}`,
      price: Number(item.amount || item.price || 0),
      quantity: Number(item.quantity || 1),
    }));
  });

  // 2. Financial Adjustments State
  const [tax, setTax] = useState(() => Number(receiptData.tax || 0));
  const [tip, setTip] = useState(() => Number(receiptData.tip || 0));
  const [tipMode, setTipMode] = useState("equal"); // "equal" (default) | "proportional"
  const [discount, setDiscount] = useState(() => Number(receiptData.discount || 0));
  const [totalAmount, setTotalAmount] = useState(() => Number(receiptData.totalAmount || 0));
  const [tipPercentagePreset, setTipPercentagePreset] = useState(null);

  // 3. New Item Form State
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);

  // 4. Active participants at the table
  const [activeParticipants, setActiveParticipants] = useState(() => {
    const list = [...initialParticipants];
    if (Array.isArray(receiptData.suggestedParticipantUserIds)) {
      receiptData.suggestedParticipantUserIds.forEach((pId) => {
        if (!list.some((p) => p.id === pId)) {
          const found = allAvailableContacts.find((c) => c.id === pId);
          if (found) list.push(found);
        }
      });
    }
    // Ensure current user is at the table
    if (!list.some((p) => p.id === currentUserId)) {
      const self = allAvailableContacts.find((c) => c.id === currentUserId) || {
        id: currentUserId,
        name: "You",
      };
      list.unshift(self);
    }
    return list;
  });

  // 5. Selected Payer
  const [selectedPayerId, setSelectedPayerId] = useState(() => {
    return receiptData.suggestedPayerUserId || currentUserId;
  });

  // 6. Popover Search State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: searchedUsers } = useConvexQuery(
    api.users.searchUsers,
    searchQuery.trim().length >= 2 ? { query: searchQuery.trim() } : "skip"
  );

  // 7. Weighted Assignments Matrix: { [itemId]: { [userId]: weight } }
  const [assignments, setAssignments] = useState(() => {
    const initial = {};
    const defaultParticipants = activeParticipants.map((p) => p.id);
    (receiptData.lineItems || []).forEach((item, idx) => {
      const itemId = item.id || `item_${idx}_${Date.now()}`;
      initial[itemId] = {};
      // Default: If 1 participant, auto assign; if multiple, assign to all by default
      defaultParticipants.forEach((pId) => {
        initial[itemId][pId] = 1;
      });
    });
    return initial;
  });

  // 8. Dynamic Tip Presets calculation based on items subtotal
  const rawSubtotal = useMemo(() => {
    return Math.round(items.reduce((s, it) => s + (Number(it.price) || 0), 0) * 100) / 100;
  }, [items]);

  const applyTipPreset = (percent) => {
    setTipPercentagePreset(percent);
    const calculatedTip = Math.round(rawSubtotal * (percent / 100) * 100) / 100;
    setTip(calculatedTip);
    // Automatically keep totalAmount synced
    setTotalAmount(Math.round((rawSubtotal + tax + calculatedTip - discount) * 100) / 100);
  };

  // 9. Run Apportionment Math Engine
  const mathResult = useMemo(() => {
    return calculateReceiptSplits({
      lineItems: items,
      assignments,
      activeParticipants,
      tax,
      tip,
      tipMode,
      discount,
      totalAmount,
      selectedPayerId,
    });
  }, [items, assignments, activeParticipants, tax, tip, tipMode, discount, totalAmount, selectedPayerId]);

  // 10. Actions & Mutators

  // Toggle or increment participant weight on an item
  const toggleParticipant = (itemId, userId) => {
    setAssignments((prev) => {
      const itemAssignments = { ...(prev[itemId] || {}) };
      const currentWeight = itemAssignments[userId] || 0;
      if (currentWeight > 0) {
        delete itemAssignments[userId];
      } else {
        itemAssignments[userId] = 1;
      }
      return { ...prev, [itemId]: itemAssignments };
    });
  };

  // Assign item to EVERY participant at the table
  const assignToAll = (itemId) => {
    setAssignments((prev) => {
      const itemAssignments = {};
      activeParticipants.forEach((p) => {
        itemAssignments[p.id] = 1;
      });
      return { ...prev, [itemId]: itemAssignments };
    });
  };

  // Quick Action: Assign all currently unassigned items to all participants
  const quickAssignAllUnassigned = () => {
    setAssignments((prev) => {
      const updated = { ...prev };
      items.forEach((it) => {
        const itemAssignments = updated[it.id] || {};
        const totalWeight = Object.values(itemAssignments).reduce((a, b) => a + b, 0);
        if (totalWeight <= 0) {
          updated[it.id] = {};
          activeParticipants.forEach((p) => {
            updated[it.id][p.id] = 1;
          });
        }
      });
      return updated;
    });
  };

  // Add participant to the table
  const addParticipant = (contact) => {
    if (activeParticipants.some((p) => p.id === contact.id)) return;
    setActiveParticipants((prev) => [...prev, contact]);
    setIsAddUserOpen(false);
  };

  // Add a newly missed line item
  const handleAddNewItem = (e) => {
    e?.preventDefault();
    if (!newItemName.trim() || !newItemPrice || Number(newItemPrice) <= 0) return;

    const newItemId = `item_custom_${Date.now()}`;
    const priceNum = Math.round(Number(newItemPrice) * 100) / 100;
    const newItem = {
      id: newItemId,
      name: newItemName.trim(),
      price: priceNum,
      quantity: 1,
    };

    setItems((prev) => [...prev, newItem]);
    // Assign to all by default
    setAssignments((prev) => ({
      ...prev,
      [newItemId]: activeParticipants.reduce((acc, p) => ({ ...acc, [p.id]: 1 }), {}),
    }));

    // Auto update total
    setTotalAmount((prevTotal) => Math.round((prevTotal + priceNum) * 100) / 100);

    setNewItemName("");
    setNewItemPrice("");
    setIsAddingItem(false);
  };

  // Delete a line item
  const handleDeleteItem = (itemId) => {
    const itemToDelete = items.find((it) => it.id === itemId);
    const priceToDeduct = itemToDelete ? itemToDelete.price : 0;

    setItems((prev) => prev.filter((it) => it.id !== itemId));
    setAssignments((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });

    setTotalAmount((prevTotal) =>
      Math.max(0, Math.round((prevTotal - priceToDeduct) * 100) / 100)
    );
  };

  // Inline edit item
  const handleUpdateItem = (itemId, updatedName, updatedPrice) => {
    const priceNum = Math.max(0, Number(updatedPrice) || 0);
    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId ? { ...it, name: updatedName, price: priceNum } : it
      )
    );
    setEditingItemId(null);
  };

  // Finalize & Output Proposal
  const handleFinalize = () => {
    if (!mathResult.isValid) return;

    const itemizedBreakdown = items.map((it) => {
      const itemAssignments = assignments[it.id] || {};
      const totalWeight = Object.values(itemAssignments).reduce((a, b) => a + b, 0);
      const assignmentsArray = Object.entries(itemAssignments).map(([userId, weight]) => ({
        userId,
        weight,
        amount: totalWeight > 0 ? Math.round((it.price * (weight / totalWeight)) * 100) / 100 : 0,
      }));

      return {
        id: it.id,
        name: it.name,
        price: it.price,
        quantity: it.quantity || 1,
        assignments: assignmentsArray,
      };
    });

    const payerObj = activeParticipants.find((p) => p.id === selectedPayerId);
    const payerName = payerObj?.name || "You";

    const proposal = {
      type: "expense_proposal",
      description: receiptData.merchantName
        ? `${receiptData.merchantName} Receipt`
        : "Receipt Expense",
      amount: totalAmount,
      currency: receiptCurrency,
      category: receiptData.category || "foodDrink",
      date: receiptData.date || Date.now(),
      paidByUserId: selectedPayerId,
      groupId: null,
      splitType: "exact",
      splits: mathResult.splits,
      itemizedBreakdown,
      reasoning: `Itemized breakdown for ${payerName}: Total ${fmt(totalAmount)} (Tax: ${fmt(tax)}, Tip: ${fmt(tip)}, Discount: ${fmt(discount)})`,
      confidence: receiptData.confidence || 0.98,
    };

    onComplete(proposal);
  };

  const availableToAdd = allAvailableContacts.filter(
    (c) => !activeParticipants.some((p) => p.id === c.id)
  );

  return (
    <div className="space-y-5">
      {/* 1. Header Card with Merchant & Quick Image Preview */}
      <div className="p-4 bg-muted/40 rounded-xl border border-border/50 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-green-500/10 text-green-600 border border-green-500/20">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base leading-snug">
                {receiptData.merchantName || "Itemized Receipt"}
              </h3>
              <p className="text-xs text-muted-foreground">
                Tap members to claim line items • Tax & Tip pro-rate automatically
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {filePreview && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsImagePreviewOpen(!isImagePreviewOpen)}
                className="h-8 text-xs gap-1.5 border-border/60"
              >
                <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{isImagePreviewOpen ? "Hide Bill" : "View Bill"}</span>
                {isImagePreviewOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            )}
            <div className="text-right">
              <span className="text-xl font-extrabold text-green-600">
                {fmt(totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Collapsible Image Zoom Preview */}
        {filePreview && isImagePreviewOpen && (
          <div className="p-2 bg-background rounded-lg border border-border/60 max-h-60 overflow-auto flex justify-center">
            <img
              src={filePreview}
              alt="Scanned Receipt"
              className="max-h-56 object-contain rounded"
            />
          </div>
        )}
      </div>

      {/* 2. Total Discrepancy Error Banner */}
      {mathResult.error === "TOTAL_MISMATCH" && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 space-y-2">
          <div className="flex items-start gap-2 text-xs font-semibold">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <span>Receipt total mismatch detected:</span>
              <p className="font-normal text-[11px] opacity-90 mt-0.5">
                Items ({fmt(mathResult.itemsSubtotal)}) + Tax ({fmt(tax)}) + Tip ({fmt(tip)}) - Discount ({fmt(discount)}) ={" "}
                <strong className="font-semibold">{fmt(mathResult.expectedTotal)}</strong>, but the scanned total is{" "}
                <strong className="font-semibold">{fmt(totalAmount)}</strong> (Discrepancy: {fmt(Math.abs(mathResult.discrepancy))}).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-500/20">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setTotalAmount(mathResult.expectedTotal)}
              className="h-7 text-xs bg-amber-500/20 border-amber-500/40 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200"
            >
              ✓ Set Grand Total to {fmt(mathResult.expectedTotal)}
            </Button>
            {mathResult.discrepancy > 0 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const serviceCharge = Math.abs(mathResult.discrepancy);
                  setItems((prev) => [
                    ...prev,
                    {
                      id: `item_service_fee_${Date.now()}`,
                      name: "Service Fee / Other",
                      price: serviceCharge,
                      quantity: 1,
                    },
                  ]);
                }}
                className="h-7 text-xs"
              >
                + Add {fmt(mathResult.discrepancy)} as Service Fee
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 3. Who Paid & Participant Chips */}
      <div className="p-3.5 bg-muted/30 rounded-xl border border-border/50 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <CreditCard className="h-3.5 w-3.5 text-green-600" />
            <span>Payer:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {activeParticipants.map((p) => {
              const isPayer = p.id === selectedPayerId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPayerId(p.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer border ${
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
                  <span>{p.id === currentUserId ? "You" : p.name?.split(" ")[0]}</span>
                  {isPayer && <Check className="h-3 w-3" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Add Person Popover */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
          <span className="text-xs text-muted-foreground">
            People at table ({activeParticipants.length}):
          </span>

          <Popover open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                <UserPlus className="h-3 w-3" />
                Add Person
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="end">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Search friends or email..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  className="h-8 text-xs"
                />
                <CommandList>
                  {searchQuery.trim().length >= 2 ? (
                    <>
                      {searchedUsers && searchedUsers.length > 0 ? (
                        <CommandGroup heading="Global Search Results">
                          {searchedUsers
                            .filter((u) => !activeParticipants.some((p) => p.id === u.id))
                            .map((user) => (
                              <CommandItem
                                key={user.id}
                                onSelect={() => {
                                  addParticipant(user);
                                  setSearchQuery("");
                                }}
                                className="flex items-center gap-2 text-xs cursor-pointer"
                              >
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={user.imageUrl} />
                                  <AvatarFallback className="text-[10px]">
                                    {user.name?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="truncate">
                                  <div className="font-medium">{user.name}</div>
                                  <div className="text-[10px] text-muted-foreground">{user.email}</div>
                                </div>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      ) : (
                        <CommandEmpty>No user found for &quot;{searchQuery}&quot;</CommandEmpty>
                      )}
                    </>
                  ) : (
                    <>
                      {availableToAdd.length > 0 ? (
                        <CommandGroup heading="Your Contacts">
                          {availableToAdd.map((contact) => (
                            <CommandItem
                              key={contact.id}
                              onSelect={() => {
                                addParticipant(contact);
                                setSearchQuery("");
                              }}
                              className="flex items-center gap-2 text-xs cursor-pointer"
                            >
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={contact.imageUrl} />
                                <AvatarFallback className="text-[10px]">
                                  {contact.name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="truncate">
                                <div className="font-medium">{contact.name}</div>
                                <div className="text-[10px] text-muted-foreground">{contact.email}</div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      ) : (
                        <div className="p-3 text-center text-xs text-muted-foreground">
                          Type an email or name to find someone
                        </div>
                      )}
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* 4. Line Items Matrix */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs px-1">
          <span className="font-semibold uppercase tracking-wider text-[11px] text-muted-foreground">
            Receipt Items ({items.length})
          </span>

          {mathResult.unassignedItemsCount > 0 ? (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] gap-1 py-0.5">
                <AlertCircle className="h-3 w-3" />
                {mathResult.unassignedItemsCount} unassigned
              </Badge>
              <button
                type="button"
                onClick={quickAssignAllUnassigned}
                className="text-xs text-green-600 hover:underline font-medium cursor-pointer"
              >
                Split all remaining
              </button>
            </div>
          ) : (
            <span className="text-green-600 font-medium text-xs flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> All items assigned
            </span>
          )}
        </div>

        {/* Item Rows */}
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {items.map((item, idx) => {
            const itemAssignments = assignments[item.id] || {};
            const isEditing = editingItemId === item.id;

            return (
              <div
                key={item.id || idx}
                className={`p-3 rounded-xl border transition shadow-sm space-y-2.5 ${
                  Object.keys(itemAssignments).length === 0
                    ? "bg-card border-amber-500/40"
                    : "bg-card border-border/70 hover:border-green-500/30"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        defaultValue={item.name}
                        id={`name_${item.id}`}
                        className="h-7 text-xs flex-1"
                        placeholder="Item name"
                      />
                      <Input
                        defaultValue={item.price}
                        id={`price_${item.id}`}
                        type="number"
                        step="0.01"
                        className="h-7 text-xs w-20"
                        placeholder="Price"
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 text-xs px-2 bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          const n = document.getElementById(`name_${item.id}`)?.value || item.name;
                          const p = document.getElementById(`price_${item.id}`)?.value || item.price;
                          handleUpdateItem(item.id, n, p);
                        }}
                      >
                        Save
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="font-medium text-sm flex items-center gap-2 min-w-0">
                        <span className="text-muted-foreground text-xs shrink-0">#{idx + 1}</span>
                        <span className="truncate">{item.name}</span>
                        <button
                          type="button"
                          onClick={() => setEditingItemId(item.id)}
                          className="text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100 transition p-1"
                          title="Edit item"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="font-bold text-sm">{fmt(item.price)}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-muted-foreground hover:text-red-500 transition p-1 cursor-pointer"
                          title="Delete item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Participant Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {activeParticipants.map((p) => {
                      const isSelected = Boolean(itemAssignments[p.id]);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggleParticipant(item.id, p.id)}
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium transition cursor-pointer border ${
                            isSelected
                              ? "bg-green-600 text-white border-green-600 shadow-sm"
                              : "bg-muted text-muted-foreground border-transparent hover:border-border"
                          }`}
                        >
                          <Avatar className="h-3.5 w-3.5">
                            <AvatarImage src={p.imageUrl} />
                            <AvatarFallback className="text-[8px]">
                              {p.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{p.id === currentUserId ? "You" : p.name?.split(" ")[0]}</span>
                          {isSelected && <Check className="h-2.5 w-2.5" />}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => assignToAll(item.id)}
                    className="text-[11px] text-muted-foreground hover:text-green-600 underline cursor-pointer"
                  >
                    Everyone
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Missed Item Form */}
        {isAddingItem ? (
          <form onSubmit={handleAddNewItem} className="p-3 bg-muted/40 rounded-xl border border-dashed border-border flex items-center gap-2">
            <Input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="e.g. Extra Garlic Bread"
              className="h-8 text-xs flex-1"
              autoFocus
            />
            <Input
              value={newItemPrice}
              onChange={(e) => setNewItemPrice(e.target.value)}
              type="number"
              step="0.01"
              placeholder="Price"
              className="h-8 text-xs w-24"
            />
            <Button type="submit" size="sm" className="h-8 text-xs bg-green-600 hover:bg-green-700">
              Add
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingItem(false)} className="h-8 text-xs">
              Cancel
            </Button>
          </form>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAddingItem(true)}
            className="w-full h-8 text-xs border-dashed text-muted-foreground hover:text-foreground gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> Add Missed Item
          </Button>
        )}
      </div>

      {/* 5. Tax, Tip & Discount Adjustments */}
      <div className="p-3.5 bg-muted/30 rounded-xl border border-border/50 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>Tax & Tip Pro-Rating Configuration</span>
          <span className="text-[11px]">Subtotal: {fmt(mathResult.itemsSubtotal)}</span>
        </div>

        {/* Tip Presets */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground mr-1">Tip:</span>
          {[0, 10, 15, 18, 20].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => applyTipPreset(pct)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition cursor-pointer ${
                tipPercentagePreset === pct
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-background border-border hover:bg-muted text-muted-foreground"
              }`}
            >
              {pct}%
            </button>
          ))}
        </div>

        {/* Tip Distribution Strategy Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 pb-1 border-y border-border/40">
          <span className="text-[11px] text-muted-foreground">Tip Distribution:</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTipMode("equal")}
              className={`px-2.5 py-0.5 rounded text-[11px] font-medium border transition cursor-pointer ${
                tipMode === "equal"
                  ? "bg-green-600 text-white border-green-600 shadow-sm"
                  : "bg-background border-border hover:bg-muted text-muted-foreground"
              }`}
            >
              Split Equally
            </button>
            <button
              type="button"
              onClick={() => setTipMode("proportional")}
              className={`px-2.5 py-0.5 rounded text-[11px] font-medium border transition cursor-pointer ${
                tipMode === "proportional"
                  ? "bg-green-600 text-white border-green-600 shadow-sm"
                  : "bg-background border-border hover:bg-muted text-muted-foreground"
              }`}
            >
              Proportional
            </button>
          </div>
        </div>

        {/* Numeric Inputs */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <div>
            <label className="text-[10px] text-muted-foreground block mb-1">Tax Amount</label>
            <Input
              type="number"
              step="0.01"
              value={tax}
              onChange={(e) => {
                const val = Math.max(0, Number(e.target.value) || 0);
                setTax(val);
                setTotalAmount(Math.round((rawSubtotal + val + tip - discount) * 100) / 100);
              }}
              className="h-7 text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground block mb-1">Tip Amount</label>
            <Input
              type="number"
              step="0.01"
              value={tip}
              onChange={(e) => {
                const val = Math.max(0, Number(e.target.value) || 0);
                setTip(val);
                setTipPercentagePreset(null);
                setTotalAmount(Math.round((rawSubtotal + tax + val - discount) * 100) / 100);
              }}
              className="h-7 text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground block mb-1">Discount (-)</label>
            <Input
              type="number"
              step="0.01"
              value={discount}
              onChange={(e) => {
                const val = Math.max(0, Number(e.target.value) || 0);
                setDiscount(val);
                setTotalAmount(Math.round((rawSubtotal + tax + tip - val) * 100) / 100);
              }}
              className="h-7 text-xs"
            />
          </div>
        </div>
      </div>

      {/* 6. Live Participant Breakdown Cards */}
      <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          Final Totals ({receiptCurrency})
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {activeParticipants.map((p) => {
            const share = mathResult.participantTotals[p.id] || { subtotal: 0, total: 0, tax: 0, tip: 0 };
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
                      Items: {fmt(share.subtotal)}
                      {share.tax > 0 && ` • Tax: ${fmt(share.tax)}`}
                      {share.tip > 0 && ` • Tip: ${fmt(share.tip)}`}
                    </div>
                  </div>
                </div>
                <div className="font-bold text-sm text-green-600">
                  {fmt(share.total)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. Bottom Action Buttons with Hard-Gated Protection */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Button variant="outline" type="button" onClick={onCancel}>
          Back
        </Button>

        <Button
          type="button"
          disabled={!mathResult.isValid}
          onClick={handleFinalize}
          className={`gap-2 ${
            mathResult.isValid
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "opacity-60 cursor-not-allowed"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          {mathResult.unassignedItemsCount > 0
            ? `Assign remaining (${mathResult.unassignedItemsCount}) items`
            : mathResult.error === "TOTAL_MISMATCH"
            ? "Resolve Total Mismatch"
            : "Generate Proposal"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
