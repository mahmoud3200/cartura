"use client";

import type { UserRoleOption } from "@cartura/contracts/authorization";
import type { UserRole } from "@cartura/contracts/users";
import { LoaderCircle, UserRoundCog } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverPositioner,
  PopoverTrigger,
} from "@/shared/ui/popover";
import {
  Select,
  SelectItem,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectTrigger,
} from "@/shared/ui/select";
import { updateUserRoleAction } from "../actions/update-user-role.action";

export function UserRoleManager({
  userId,
  userName,
  role,
  roleOptions,
}: {
  userId: string;
  userName: string;
  role: UserRole;
  roleOptions: UserRoleOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState(role.id);
  const [isPending, startTransition] = useTransition();
  const isProtected = role.name === "super_admin";
  const hasChanged = selectedRoleId !== role.id;
  const selectedRole = roleOptions.find(
    (option) => option.id === selectedRoleId,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        className="h-8 w-auto gap-1.5 px-2.5 text-xs font-medium"
        aria-label={`Change role for ${userName}`}
      >
        <UserRoundCog className="size-4" />
        Change role
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverPositioner>
          <PopoverContent className="w-[min(24rem,calc(100vw-1.5rem))] p-4">
            <div>
              <h3 className="font-semibold">Change role</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Each account has exactly one role. Saving a new choice replaces
                the current role.
              </p>
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground">
                Current role
              </p>
              <p className="mt-1 text-sm font-medium capitalize">
                {role.name.replaceAll("_", " ")}
              </p>
            </div>

            {isProtected ? (
              <p className="mt-4 rounded-lg border border-border bg-muted/45 p-3 text-xs leading-5 text-muted-foreground">
                The super admin role is managed by server bootstrap and cannot
                be changed here.
              </p>
            ) : (
              <>
                <div className="mt-5 space-y-2">
                  <Label htmlFor={`role-${userId}`}>
                    New role
                  </Label>
                  <Select
                    value={selectedRoleId}
                    onValueChange={(nextRoleId) => {
                      if (nextRoleId) setSelectedRoleId(nextRoleId);
                    }}
                  >
                    <SelectTrigger
                      id={`role-${userId}`}
                      className="h-10"
                      aria-label={`New role for ${userName}`}
                      disabled={roleOptions.length === 0}
                    >
                      <span className="truncate capitalize">
                        {(selectedRole?.name ?? role.name).replaceAll("_", " ")}
                      </span>
                    </SelectTrigger>
                    <SelectPortal>
                      <SelectPositioner>
                        <SelectPopup>
                          <SelectList>
                            {roleOptions.map((option) => (
                              <SelectItem key={option.id} value={option.id}>
                                <span className="capitalize">
                                  {option.name.replaceAll("_", " ")}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectList>
                        </SelectPopup>
                      </SelectPositioner>
                    </SelectPortal>
                  </Select>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {roleOptions.length === 0
                      ? "No assignable roles are available."
                      : "The current role stays active until you save."}
                  </p>
                </div>

                <Button
                  type="button"
                  className="mt-4 w-full"
                  disabled={!hasChanged || isPending}
                  onClick={updateRole}
                >
                  {isPending ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : null}
                  {isPending ? "Saving role..." : "Save role"}
                </Button>
              </>
            )}
          </PopoverContent>
        </PopoverPositioner>
      </PopoverPortal>
    </Popover>
  );

  function updateRole() {
    startTransition(async () => {
      const result = await updateUserRoleAction(userId, {
        roleId: selectedRoleId,
      });

      if (!result.ok) {
        toast.error("Role was not updated", {
          description: result.message,
        });
        return;
      }

      toast.success(
        `${selectedRole?.name.replaceAll("_", " ") ?? "Role"} saved`,
      );
      setOpen(false);
      router.refresh();
    });
  }
}
