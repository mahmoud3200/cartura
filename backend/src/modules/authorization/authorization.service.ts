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
import {
  cacheService,
  type CacheService,
} from "../../infrastructure/cache/index.js";

const authorizationCacheKeys = {
  userPermissions: (userId: string) => `authorization:user:${userId}:permissions`,
  allUserPermissions: "authorization:user:*:permissions",
};

export class AuthorizationService {
  constructor(
    private readonly repository: AuthorizationRepository = authorizationRepository,
    private readonly cache: CacheService = cacheService,
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
    return this.cache.remember(
      authorizationCacheKeys.userPermissions(userId),
      () => this.repository.findUserPermissionNames(userId),
    );
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
    const existingRole = await this.repository.findRoleByName(input.name);

    if (existingRole) {
      throw conflictError(
        "ROLE_NAME_ALREADY_EXISTS",
        "A role with this name already exists",
      );
    }

    return this.repository.createCustomRole(input, audit ? {
      ...audit,
      action: "role.create",
      resourceType: "role",
      metadata: {
        name: input.name,
        description: input.description ?? null,
        permissionIds: input.permissionIds,
      },
    } : undefined);
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

    const updatedRole = await this.repository.updateCustomRole(input, input.audit ? {
      ...input.audit,
      action: "role.update",
      resourceType: "role",
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
          permissionIds:
            input.permissionIds ??
            role.rolePermissions.map((permission) => permission.permissionId),
        },
      },
    } : undefined);

    if (input.permissionIds !== undefined) {
      await this.cache.deleteByPattern(
        authorizationCacheKeys.allUserPermissions,
      );
    }

    return updatedRole;
  }

  async replaceRolePermissions(input: UpdateRolePermissionsRequest & {
    roleId: string;
    audit?: AuditContext | undefined;
  }): Promise<void> {
    const role = await this.assertCustomRole(input.roleId);
    await this.repository.replaceRolePermissions(input, input.audit ? {
      ...input.audit,
      action: "role.permissions.replace",
      resourceType: "role",
      resourceId: input.roleId,
      metadata: {
        name: role.name,
      },
    } : undefined);
    await this.cache.deleteByPattern(
      authorizationCacheKeys.allUserPermissions,
    );
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
        action: "role.delete",
        resourceType: "role",
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
    await this.cache.deleteByPattern(
      authorizationCacheKeys.allUserPermissions,
    );
    return deletedRole;
  }

  async updateUserRole(input: UpdateUserRoleRequest & {
    userId: string;
    assignedBy?: string | undefined;
    audit?: AuditContext | undefined;
  }) {
    await this.assertRoleCanBeAssigned(input.roleId);
    const user = await this.repository.findUserRole(input.userId);

    if (!user) {
      throw notFoundError("USER_NOT_FOUND", "User not found");
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
      input,
      input.audit ? {
        ...input.audit,
        action: "user_role.update",
        resourceType: "user",
        resourceId: input.userId,
        metadata: {
          previousRoleId: user.assignedRole?.roleId ?? null,
          nextRoleId: input.roleId,
          assignedBy: input.assignedBy ?? null,
        },
      } : undefined,
    );
    await this.cache.delete(
      authorizationCacheKeys.userPermissions(input.userId),
    );
    return assignment;
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
