import { createRoleRequestSchema } from "@cartura/contracts/authorization";
import { z } from "zod";

import type { ManagementPermission } from "../api/roles-api";

export type RoleFormState = {
  name: string;
  description: string;
  permissionIds: Set<string>;
};

export type RoleFieldErrors = Partial<
  Record<"name" | "description" | "permissionIds", string>
>;

export function validateRoleForm(form: RoleFormState) {
  return createRoleRequestSchema.safeParse({
    name: form.name,
    description: optionalRoleText(form.description),
    permissionIds: Array.from(form.permissionIds),
  });
}

export function toRoleFieldErrors(error: z.ZodError): RoleFieldErrors {
  const errors = z.flattenError(error).fieldErrors as Record<
    string,
    string[] | undefined
  >;
  return {
    name: errors.name?.[0],
    description: errors.description?.[0],
    permissionIds: errors.permissionIds?.[0],
  };
}

export function groupPermissions(permissions: ManagementPermission[]) {
  const groups = new Map<string, ManagementPermission[]>();

  for (const permission of permissions) {
    const group = permission.name.split(".")[0] ?? "other";
    groups.set(group, [...(groups.get(group) ?? []), permission]);
  }

  return Array.from(groups.entries()).sort(([left], [right]) =>
    left.localeCompare(right),
  );
}

export function groupPermissionNames(permissionNames: string[]) {
  const groups = new Map<string, Array<{ name: string; label: string }>>();

  for (const permissionName of permissionNames) {
    const [group = "other", ...actionParts] = permissionName.split(".");
    const label = actionParts.length ? actionParts.join(".") : permissionName;
    groups.set(group, [
      ...(groups.get(group) ?? []),
      { name: permissionName, label },
    ]);
  }

  return Array.from(groups.entries()).sort(([left], [right]) =>
    left.localeCompare(right),
  );
}

function optionalRoleText(value: string) {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}
