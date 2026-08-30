import type {
  Permission as PermissionResponse,
  Role as RoleResponse,
  UserRoleOption,
} from "@cartura/contracts/authorization";
import { permissionNameSchema } from "@cartura/contracts/authorization";

import type { Permission } from "../../generated/prisma/client.js";
import type { RoleWithPermissions } from "./authorization.repository.js";

export function mapPermission(permission: Permission): PermissionResponse {
  return {
    id: permission.id,
    name: permissionNameSchema.parse(permission.name),
    description: permission.description,
  };
}

export function mapRole(role: RoleWithPermissions): RoleResponse {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isSystemRole: role.isSystemRole,
    rolePermissions: role.rolePermissions.map(({ permission }) => ({
      permission: mapPermission(permission),
    })),
  };
}

export function mapUserRoleOption(role: {
  id: string;
  name: string;
  description: string | null;
  isSystemRole: boolean;
}): UserRoleOption {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isSystemRole: role.isSystemRole,
  };
}
