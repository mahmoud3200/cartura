import {
  AUDIT_ACTIONS,
  AUDIT_RESOURCE_TYPES,
} from "@cartura/contracts/audit-logs";
import { SYSTEM_ROLES, type PermissionName } from "./authorization.constants.js";
import type { AuditContext } from "../audit-logs/audit-logs.types.js";
import {
  conflictError,
  httpError,
  notFoundError,
} from "../../shared/errors/index.js";
import type {
  CreateRoleRequest,
  ListRolesQuery,
  UpdateRolePermissionsRequest,
  UpdateRoleRequest,
  UpdateUserRoleRequest,
} from "@cartura/contracts/authorization";
import {
  authorizationRepository,
  type AuthorizationRepository,
} from "./authorization.repository.js";
import {
  includesAllPermissions,
  includesAnyPermission,
} from "./authorization.utils.js";
import { getUserRoleUpdateDenial } from "./authorization.policy.js";
import {
  cantChangeOwnRoleError,
  cantChangeProtectedUserRoleError,
} from "./authorization.errors.js";
import { hasPrismaErrorCode } from "./authorization.persistence.js";

export class AuthorizationService {
  constructor(
    private readonly repository: AuthorizationRepository = authorizationRepository,
  ) {}

  listPermissions() {
    return this.repository.findPermissions();
  }

  listRoles(query: ListRolesQuery) {
    return this.repository.findRoles(query);
  }

  listAssignableUserRoles() {
    return this.repository.findAssignableUserRoles();
  }

  async getRole(roleId: string) {
    const role = await this.repository.findRoleById(roleId);

    if (!role) {
      throw notFoundError("ROLE_NOT_FOUND", "Role not found");
    }

    return role;
  }

  listUserPermissionNames(userId: string) {
    return this.repository.findUserPermissionNames(userId);
  }

  async hasAllPermissions(
    userId: string,
    requiredPermissions: readonly PermissionName[],
  ): Promise<boolean> {
    if (requiredPermissions.length === 0) {
      return true;
    }

    const permissionNames = await this.listUserPermissionNames(userId);

    return includesAllPermissions(permissionNames, requiredPermissions);
  }

  async hasAnyPermission(
    userId: string,
    allowedPermissions: readonly PermissionName[],
  ): Promise<boolean> {
    if (allowedPermissions.length === 0) {
      return true;
    }

    const permissionNames = await this.listUserPermissionNames(userId);

    return includesAnyPermission(permissionNames, allowedPermissions);
  }

  async createCustomRole(input: CreateRoleRequest, audit?: AuditContext) {
    const permissionIds = normalizePermissionIds(input.permissionIds);
    await this.assertPermissionIdsExist(permissionIds);
    const existingRole = await this.repository.findRoleByName(input.name);

    if (existingRole) {
      throw conflictError(
        "ROLE_NAME_ALREADY_EXISTS",
        "A role with this name already exists",
      );
    }

    try {
      return await this.repository.createCustomRole(
        { ...input, permissionIds },
        audit ? {
          ...audit,
          action: AUDIT_ACTIONS.ROLE_CREATE,
          resourceType: AUDIT_RESOURCE_TYPES.ROLE,
          metadata: {
            name: input.name,
            description: input.description ?? null,
            permissionIds,
          },
        } : undefined,
      );
    } catch (error) {
      throwRoleWriteError(error);
    }
  }

  async updateCustomRole(input: UpdateRoleRequest & {
    roleId: string;
    audit?: AuditContext | undefined;
  }) {
    const role = await this.assertCustomRole(input.roleId);

    if (input.name && input.name !== role.name) {
      const existingRole = await this.repository.findRoleByName(input.name);
      if (existingRole && existingRole.id !== input.roleId) {
        throw conflictError(
          "ROLE_NAME_ALREADY_EXISTS",
          "A role with this name already exists",
        );
      }
    }

    try {
      return await this.repository.updateCustomRole(input, input.audit ? {
        ...input.audit,
        action: AUDIT_ACTIONS.ROLE_UPDATE,
        resourceType: AUDIT_RESOURCE_TYPES.ROLE,
        resourceId: input.roleId,
        metadata: {
          previous: {
            name: role.name,
            description: role.description,
          },
          next: {
            name: input.name ?? role.name,
            description:
              input.description === undefined
                ? role.description
                : input.description,
          },
        },
      } : undefined);
    } catch (error) {
      throwRoleWriteError(error);
    }
  }

  async replaceRolePermissions(input: UpdateRolePermissionsRequest & {
    roleId: string;
    audit?: AuditContext | undefined;
  }): Promise<void> {
    const permissionIds = normalizePermissionIds(input.permissionIds);
    await this.assertPermissionIdsExist(permissionIds);
    const role = await this.assertCustomRole(input.roleId);
    try {
      await this.repository.replaceRolePermissions(
        { ...input, permissionIds },
        input.audit ? {
          ...input.audit,
          action: AUDIT_ACTIONS.ROLE_PERMISSIONS_REPLACE,
          resourceType: AUDIT_RESOURCE_TYPES.ROLE,
          resourceId: input.roleId,
          metadata: { name: role.name },
        } : undefined,
      );
    } catch (error) {
      throwRoleWriteError(error);
    }
  }

  async deleteCustomRole(roleId: string, audit?: AuditContext) {
    const role = await this.assertCustomRole(roleId);

    const customerRole = await this.repository.findRoleByName(
      SYSTEM_ROLES.CUSTOMER,
    );

    if (!customerRole) {
      throw notFoundError(
        "CUSTOMER_ROLE_NOT_FOUND",
        "The default customer role is not configured",
      );
    }

    const deletedRole = await this.repository.deleteRole(
      roleId,
      customerRole.id,
      audit ? {
        ...audit,
        action: AUDIT_ACTIONS.ROLE_DELETE,
        resourceType: AUDIT_RESOURCE_TYPES.ROLE,
        resourceId: roleId,
        metadata: {
          name: role.name,
          description: role.description,
          permissionIds: role.rolePermissions.map((permission) =>
            permission.permissionId
          ),
        },
      } : undefined,
    );
    return deletedRole;
  }

  async updateUserRole(input: UpdateUserRoleRequest & {
    userId: string;
    actingUserId: string;
    audit?: AuditContext | undefined;
  }) {
    await this.assertRoleCanBeAssigned(input.roleId);
    const [user, actingUser] = await Promise.all([
      this.repository.findUserRole(input.userId),
      this.repository.findUserRole(input.actingUserId),
    ]);

    if (!user) {
      throw notFoundError("USER_NOT_FOUND", "User not found");
    }

    if (!actingUser) {
      throw notFoundError("ACTING_USER_NOT_FOUND", "Acting user not found");
    }

    const denial = getUserRoleUpdateDenial({
      actingUserId: input.actingUserId,
      actingRoleName: actingUser.assignedRole?.role.name ?? null,
      targetUserId: input.userId,
      targetRoleName: user.assignedRole?.role.name ?? null,
    });

    if (denial === "self_role_change") {
      throw cantChangeOwnRoleError();
    }

    if (denial === "protected_role_change") {
      throw cantChangeProtectedUserRoleError();
    }

    if (user.assignedRole?.role.name === SYSTEM_ROLES.SUPER_ADMIN) {
      throw httpError(
        403,
        "SUPER_ADMIN_ROLE_PROTECTED",
        "The super admin role is managed by server bootstrap only",
      );
    }

    if (user.assignedRole?.roleId === input.roleId) {
      return user.assignedRole;
    }

    const assignment = await this.repository.replaceUserRole(
      {
        userId: input.userId,
        roleId: input.roleId,
        assignedBy: input.actingUserId,
      },
      input.audit ? {
        ...input.audit,
        action: AUDIT_ACTIONS.USER_ROLE_UPDATE,
        resourceType: AUDIT_RESOURCE_TYPES.USER,
        resourceId: input.userId,
        metadata: {
          previousRoleId: user.assignedRole?.roleId ?? null,
          nextRoleId: input.roleId,
          assignedBy: input.actingUserId,
        },
      } : undefined,
    );
    return assignment;
  }

  private async assertPermissionIdsExist(permissionIds: readonly string[]) {
    const existingPermissionIds = await this.repository.findPermissionIds(
      permissionIds,
    );
    const existing = new Set(existingPermissionIds);
    const missingPermissionIds = permissionIds.filter((id) => !existing.has(id));

    if (missingPermissionIds.length > 0) {
      throw httpError(
        400,
        "PERMISSION_IDS_INVALID",
        "One or more permissions do not exist",
        { permissionIds: missingPermissionIds },
      );
    }
  }

  private async assertRoleCanBeAssigned(roleId: string) {
    const role = await this.repository.findRoleById(roleId);

    if (!role) {
      throw notFoundError("ROLE_NOT_FOUND", "Role not found");
    }

    if (role.name === SYSTEM_ROLES.SUPER_ADMIN) {
      throw httpError(
        403,
        "SUPER_ADMIN_ROLE_PROTECTED",
        "The super admin role is managed by server bootstrap only",
      );
    }
  }

  private async assertCustomRole(roleId: string) {
    const role = await this.repository.findRoleById(roleId);

    if (!role) {
      throw notFoundError("ROLE_NOT_FOUND", "Role not found");
    }

    if (role.isSystemRole || role.name === SYSTEM_ROLES.SUPER_ADMIN) {
      throw httpError(
        403,
        "SYSTEM_ROLE_PROTECTED",
        "System roles cannot be modified through this endpoint",
      );
    }

    return role;
  }
}

export const authorizationService = new AuthorizationService();

function normalizePermissionIds(permissionIds: readonly string[]) {
  return [...new Set(permissionIds)].sort();
}

function throwRoleWriteError(error: unknown): never {
  if (hasPrismaErrorCode(error, "P2002")) {
    throw conflictError(
      "ROLE_NAME_ALREADY_EXISTS",
      "A role with this name already exists",
    );
  }

  if (hasPrismaErrorCode(error, "P2003")) {
    throw httpError(
      400,
      "PERMISSION_IDS_INVALID",
      "One or more permissions do not exist",
    );
  }

  throw error;
}
