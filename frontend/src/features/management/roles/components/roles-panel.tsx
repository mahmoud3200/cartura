"use client";

import { ManagementRowActions } from "@/features/management/shared/components/management-row-actions";
import {
  ManagementTable,
  ManagementTableCell,
} from "@/features/management/shared/components/management-table";
import type { ManagementRole } from "../api/roles-api";
import { useDeleteManagementRole } from "../hooks/use-roles";
import { RolesSummary } from "../ui/roles-summary";

const columns = [
  { label: "Role" },
  { label: "Type" },
  { label: "Permissions" },
  { label: "Actions", className: "text-right" },
];

export function RolesPanel({
  roles,
  totalRoles,
  query,
  canUpdateRoles,
  canDeleteRoles,
}: {
  roles: ManagementRole[];
  totalRoles: number;
  query?: string;
  canUpdateRoles: boolean;
  canDeleteRoles: boolean;
}) {
  const deleteRole = useDeleteManagementRole();

  return (
    <section className="space-y-3">
      <RolesSummary totalRoles={totalRoles} query={query} />
      <ManagementTable
        items={roles}
        columns={columns}
        gridTemplateColumns="1.4fr 0.6fr 0.7fr 0.6fr"
        getRowKey={(role) => role.id}
        emptyLabel={
          query ? "No roles match this search." : "No roles are available."
        }
        renderCells={(role) => (
          <>
            <ManagementTableCell>
              <p className="truncate font-medium">{role.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {role.description ?? "No description"}
              </p>
            </ManagementTableCell>
            <span className="w-fit rounded-sm bg-secondary px-2 py-1 text-xs text-secondary-foreground">
              {role.isSystemRole ? "System" : "Custom"}
            </span>
            <p className="font-mono text-xs text-muted-foreground">
              {role.rolePermissions.length} granted
            </p>
            {role.isSystemRole ? (
              <p className="text-right text-xs text-muted-foreground">
                Managed by system
              </p>
            ) : (
              <ManagementRowActions
                editHref={
                  canUpdateRoles
                    ? `/dashboard/roles/${role.id}/edit`
                    : undefined
                }
                canDelete={canDeleteRoles}
                isDeleting={
                  deleteRole.isPending && deleteRole.variables === role.id
                }
                resourceLabel={role.name}
                onDelete={() => deleteRole.mutate(role.id)}
              />
            )}
          </>
        )}
      />
    </section>
  );
}
