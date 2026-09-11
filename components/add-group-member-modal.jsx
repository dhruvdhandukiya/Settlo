"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Check, Search, UserPlus, Users, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";

export function AddGroupMemberModal({
  groupId,
  groupName,
  existingMembers = [],
  open,
  onOpenChange,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: contactsData, isLoading } = useConvexQuery(
    api.contacts.getAllContacts
  );
  const addMembersToGroup = useConvexMutation(api.groups.addMembersToGroup);

  const allUsers = contactsData?.users || [];

  // Filter out users who are already members of this group
  const existingMemberIds = new Set(
    existingMembers.map((m) => m.id || m.userId)
  );

  const availableUsers = allUsers.filter(
    (u) => !existingMemberIds.has(u.id)
  );

  const filteredUsers = availableUsers.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  const toggleSelectUser = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAddMembers = async () => {
    if (selectedUserIds.length === 0) {
      toast.error("Please select at least one member to add.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await addMembersToGroup.mutate({
        groupId,
        members: selectedUserIds,
      });

      toast.success(
        `Added ${res?.addedCount || selectedUserIds.length} member(s) to ${groupName || "group"}!`
      );
      setSelectedUserIds([]);
      setSearchQuery("");
      onOpenChange?.(false);
    } catch (err) {
      toast.error("Failed to add members: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                Add Members to {groupName || "Group"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Select registered users to add to this group tour or trip.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search user by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>

          {/* Selected chips */}
          {selectedUserIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-muted/40 border border-border/50">
              <span className="text-[11px] font-semibold text-muted-foreground self-center mr-1">
                Selected ({selectedUserIds.length}):
              </span>
              {selectedUserIds.map((uId) => {
                const user = allUsers.find((u) => u.id === uId);
                return (
                  <Badge
                    key={uId}
                    variant="secondary"
                    className="gap-1.5 pl-1.5 pr-2 py-1 text-xs"
                  >
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={user?.imageUrl} />
                      <AvatarFallback className="text-[9px]">
                        {user?.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{user?.name?.split(" ")[0]}</span>
                    <button
                      type="button"
                      onClick={() => toggleSelectUser(uId)}
                      className="hover:text-destructive transition"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}

          {/* User List */}
          <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Loading registered users...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                {availableUsers.length === 0
                  ? "All registered users are already in this group."
                  : "No matching users found."}
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isSelected = selectedUserIds.includes(user.id);
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggleSelectUser(user.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? "bg-primary/10 border-primary text-foreground shadow-sm"
                        : "bg-card border-border/50 hover:bg-muted/50 hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.imageUrl} />
                        <AvatarFallback className="text-xs">
                          {user.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium leading-none">
                          {user.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {user.email}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`h-5 w-5 rounded-full border flex items-center justify-center transition ${
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground/40 bg-transparent"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 pt-2">
          <Button
            variant="outline"
            type="button"
            onClick={() => onOpenChange?.(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={selectedUserIds.length === 0 || isSubmitting}
            onClick={handleAddMembers}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            {isSubmitting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Add {selectedUserIds.length > 0 ? `(${selectedUserIds.length})` : ""}{" "}
            Member{selectedUserIds.length > 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
