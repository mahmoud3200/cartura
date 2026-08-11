import { ShieldCheck } from "lucide-react";

import { ManagementFieldError } from "@/features/management/shared/components/management-form-field";
import { EmptyState } from "@/features/management/shared/components/admin-ui";
import { Checkbox } from "@/shared/ui/checkbox";
import { groupPermissions } from "../../lib/role-form";

export function RolePermissionSelector({
  permissions,
  selectedIds,
  error,
  onToggle,
}: {
  permissions: Permission[];
  selectedIds: Set<string>;
  error?: string;
  onToggle: (permissionId: string) => void;
}) {
  const groups = groupPermissions(permissions);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="size-4" />
          Select the management actions this role can perform.
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          {selectedIds.size} selected
        </p>
      </div>
      {groups.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {groups.map(([group, items]) => (
            <PermissionGroup
              key={group}
              group={group}
              permissions={items}
              selectedIds={selectedIds}
              onToggle={onToggle}
            />
          ))}
        </div>
      ) : (
        <EmptyState label="No permissions are available." />
      )}
      <ManagementFieldError message={error} />
    </div>
  );
}

function PermissionGroup({
  group,
  permissions,
  selectedIds,
  onToggle,
}: {
  group: string;
  permissions: Permission[];
  selectedIds: Set<string>;
  onToggle: (permissionId: string) => void;
}) {
  return (
    <fieldset className="rounded-xl border border-border p-4">
      <legend className="px-1 text-sm font-semibold capitalize">{group}</legend>
      <div className="mt-2 space-y-1">
        {permissions.map((permission) => (
          <label
            key={permission.id}
            className="flex cursor-pointer items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted"
          >
            <Checkbox
              checked={selectedIds.has(permission.id)}
              onCheckedChange={() => onToggle(permission.id)}
              className="mt-0.5"
            />
            <span className="min-w-0">
              <span className="block font-mono text-xs text-foreground">
                {permission.name}
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                {permission.description ?? "No description"}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
import type { Permission } from "@cartura/contracts/authorization";
