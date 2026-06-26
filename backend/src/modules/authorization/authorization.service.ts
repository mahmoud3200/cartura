import { SYSTEM_ROLES, type PermissionName } from "./authorization.constants.js";
import {
  authorizationRepository,
  type AuthorizationRepository,
} from "./authorization.repository.js";

export class AuthorizationService {
  constructor(
    private readonly repository: AuthorizationRepository = authorizationRepository,
  ) {}

  listPermissions() {
    return this.repository.findPermissions();
  }

  listRoles() {
    return this.repository.findRoles();
  }

  async hasAllPermissions(
    userId: string,
    requiredPermissions: readonly PermissionName[],
  ): Promise<boolean> {
    if (requiredPermissions.length === 0) {
      return true;
    }

    const permissionNames = await this.repository.findUserPermissionNames(userId);
    const grantedPermissions = new Set(permissionNames);

    return requiredPermissions.every((permission) =>
      grantedPermissions.has(permission),
    );
  }

  async createCustomRole(input: {
    name: string;
    description?: string | undefined;
    permissionIds: string[];
  }) {
    return this.repository.createCustomRole(input);
  }

  async updateCustomRole(input: {
    roleId: string;
    name?: string | undefined;
    description?: string | undefined;
  }) {
    await this.assertCustomRole(input.roleId);
    return this.repository.updateCustomRole(input);
  }

  async replaceRolePermissions(input: {
    roleId: string;
    permissionIds: string[];
  }): Promise<void> {
    await this.assertCustomRole(input.roleId);
    await this.repository.replaceRolePermissions(input);
  }

  async deleteCustomRole(roleId: string) {
    await this.assertCustomRole(roleId);
    return this.repository.deleteRole(roleId);
  }

  assignRole(input: {
    userId: string;
    roleId: string;
    assignedBy?: string | undefined;
  }) {
    return this.repository.assignRole(input);
  }

  removeRole(input: { userId: string; roleId: string }) {
    return this.repository.removeRole(input);
  }

  private async assertCustomRole(roleId: string): Promise<void> {
    const role = await this.repository.findRoleById(roleId);

    if (!role) {
      throw Object.assign(new Error("Role not found"), {
        statusCode: 404,
        code: "ROLE_NOT_FOUND",
      });
    }

    if (role.isSystemRole || role.name === SYSTEM_ROLES.SUPER_ADMIN) {
      throw Object.assign(
        new Error("System roles cannot be modified through this endpoint"),
        {
          statusCode: 403,
          code: "SYSTEM_ROLE_PROTECTED",
        },
      );
    }
  }
}

export const authorizationService = new AuthorizationService();
