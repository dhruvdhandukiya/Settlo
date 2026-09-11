"use client";

import React, { useState } from "react";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { AddGroupMemberModal } from "./add-group-member-modal";

export function GroupMembers({ members = [], groupId, groupName }) {
  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  return (
    <div className="space-y-4">
      {groupId && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddMemberOpen(true)}
          className="w-full gap-2 text-xs border-dashed hover:border-primary hover:text-primary"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Add Members
        </Button>
      )}

      {members.length === 0 ? (
        <div className="text-center py-4 text-xs text-muted-foreground">
          No members in this group
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((member) => {
            const isCurrentUser = member.id === currentUser?._id;
            const isAdmin = member.role === "admin";

            return (
              <div
                key={member.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.imageUrl} />
                    <AvatarFallback className="text-xs">
                      {member.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {isCurrentUser ? `${member.name} (You)` : member.name}
                      </span>
                    </div>
                    {member.email && (
                      <p className="text-[11px] text-muted-foreground">
                        {member.email}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  {isAdmin ? (
                    <Badge variant="secondary" className="text-[10px] py-0 h-5">
                      Admin
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] py-0 h-5 text-muted-foreground">
                      Member
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {groupId && (
        <AddGroupMemberModal
          groupId={groupId}
          groupName={groupName}
          existingMembers={members}
          open={isAddMemberOpen}
          onOpenChange={setIsAddMemberOpen}
        />
      )}
    </div>
  );
}
