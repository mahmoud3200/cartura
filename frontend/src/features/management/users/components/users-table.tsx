"use client";

import type {
  User,
  UserAccountStatus,
} from "@cartura/contracts/users";
import type { UserRoleOption } from "@cartura/contracts/authorization";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { StatusBadge } from "@/features/management/shared/components/admin-ui";
import { ManagementTableActions } from "@/features/management/shared/components/management-table-actions";
import {
  ManagementTable,
  ManagementTableCell,
} from "@/features/management/shared/components/management-table";
import { formatDateTime } from "@/features/management/shared/lib/admin-utils";
import { updateUserStatusAction } from "../actions/update-user-status.action";
import { UserRoleManager } from "./user-role-manager";

type UsersTableUser = User;

const columns = [
  { label: "User" },
  { label: "Role" },
  { label: "Status" },
  { label: "Joined" },
  { label: "Action", className: "text-right" },
];

export function UsersTable({
  users,
  emptyLabel,
  canUpdateStatus,
  canUpdateRole,
  roleOptions,
}: {
  users: UsersTableUser[];
  emptyLabel: string;
  canUpdateStatus: boolean;
  canUpdateRole: boolean;
  roleOptions: UserRoleOption[];
}) {
  return (
    <ManagementTable
      items={users}
      columns={columns}
      gridTemplateColumns="1.2fr 1fr 0.7fr 0.75fr 1.2fr"
      getRowKey={(user) => user.id}
      emptyLabel={emptyLabel}
      renderCells={(user) => (
        <>
          <ManagementTableCell>
            <p className="truncate font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          </ManagementTableCell>
          <p className="text-muted-foreground">
            {user.role.name.replaceAll("_", " ")}
          </p>
          <StatusBadge status={user.accountStatus} />
          <p className="text-xs text-muted-foreground">
            {formatDateTime(user.createdAt)}
          </p>
          <div className="flex items-center justify-end gap-2">
            {canUpdateRole ? (
              <UserRoleManager
                key={user.role.id}
                userId={user.id}
                userName={user.name}
                role={user.role}
                roleOptions={roleOptions}
              />
            ) : null}
            <UserStatusAction user={user} canUpdate={canUpdateStatus} />
          </div>
        </>
      )}
    />
  );
}

function UserStatusAction({
  user,
  canUpdate,
}: {
  user: UsersTableUser;
  canUpdate: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!canUpdate) {
    return <span aria-hidden="true" />;
  }

  const currentStatus = user.accountStatus as UserAccountStatus;
  const actions = (
    [
      { status: "active", label: "Set active" },
      { status: "suspended", label: "Suspend for 7 days" },
      { status: "disabled", label: "Disable account", destructive: true },
    ] satisfies Array<{
      status: UserAccountStatus;
      label: string;
      destructive?: boolean;
    }>
  )
    .filter((action) => action.status !== currentStatus)
    .map((action) => ({
      label: action.label,
      destructive: action.destructive,
      onSelect: () => updateStatus(action.status),
    }));

  return (
    <ManagementTableActions
      label={`Actions for ${user.name}`}
      actions={actions}
      isPending={isPending}
    />
  );

  function updateStatus(status: UserAccountStatus) {
    startTransition(async () => {
      const result = await updateUserStatusAction(user.id, {
        accountStatus: status,
        statusReason:
          status === "active" ? null : "Updated from management dashboard",
        suspendedUntil:
          status === "suspended"
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            : null,
      });

      if (!result.ok) {
        toast.error("User status was not updated", {
          description: result.message,
        });
        return;
      }

      toast.success("User status updated");
      router.refresh();
    });
  }
}
