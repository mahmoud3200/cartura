import type {
  ListUsersQuery,
  UpdateUserStatusRequest,
} from "@cartura/contracts/users";
import {
  AUDIT_ACTIONS,
  AUDIT_RESOURCE_TYPES,
} from "@cartura/contracts/audit-logs";

import type { AuditContext } from "../audit-logs/audit-logs.types.js";
import {
  accountDisabledError,
  accountSuspendedError,
  cantBanSuperAdminError,
  cantSelfBanError,
  notFoundError,
  userStatusChangedError,
} from "./users.errors.js";
import { usersRepository, type UsersRepository } from "./users.repository.js";
import { isExpiredSuspension, isSuperAdmin } from "./users.utils.js";

export class UsersService {
  constructor(private readonly repository: UsersRepository = usersRepository) {}

  async assertAccountCanAccess(userId: string) {
    let user = await this.repository.findAccountAccessById(userId);

    if (!user) {
      throw notFoundError();
    }

    if (isExpiredSuspension(user)) {
      const activated = await this.repository.activateExpired(
        userId,
        user.suspendedUntil!,
      );
      if (activated) return;

      user = await this.repository.findAccountAccessById(userId);
      if (!user) throw notFoundError();
    }

    if (user.accountStatus === "suspended") {
      throw accountSuspendedError({
        accountStatus: "suspended",
        statusReason: user.accountStatusReason,
        suspendedUntil: user.suspendedUntil?.toISOString() ?? null,
      });
    }

    if (user.accountStatus === "disabled") {
      throw accountDisabledError({
        accountStatus: "disabled",
        statusReason: user.accountStatusReason,
        suspendedUntil: null,
      });
    }
  }

  async list(query: ListUsersQuery) {
    await this.repository.activateExpiredSuspensions();
    return this.repository.list(query);
  }

  async getById(userId: string) {
    const user = await this.repository.findById(userId);

    if (!user) {
      throw notFoundError();
    }

    if (isExpiredSuspension(user)) {
      await this.repository.activateExpired(userId, user.suspendedUntil!);
      return this.getExistingUser(userId);
    }

    return user;
  }

  async updateStatus(
    userDoingTheRequest: string,
    userId: string,
    input: UpdateUserStatusRequest,
    audit?: AuditContext,
  ) {
    const user = await this.getExistingUser(userId);

    if (isSuperAdmin(user) && input.accountStatus !== "active") {
      throw cantBanSuperAdminError();
    }

    if (userDoingTheRequest === userId && input.accountStatus !== "active") {
      throw cantSelfBanError();
    }

    const updated = await this.repository.updateStatus(
      userId,
      input,
      {
        updatedAt: user.updatedAt,
        assignedRoleId: user.assignedRole?.roleId ?? null,
      },
      audit
        ? {
            ...audit,
            action: AUDIT_ACTIONS.USER_STATUS_UPDATE,
            resourceType: AUDIT_RESOURCE_TYPES.USER,
            resourceId: userId,
            metadata: {
              previous: {
                accountStatus: user.accountStatus,
                accountStatusReason: user.accountStatusReason,
                suspendedUntil: user.suspendedUntil?.toISOString() ?? null,
              },
              next: {
                accountStatus: input.accountStatus,
                accountStatusReason: input.statusReason ?? null,
                suspendedUntil: input.suspendedUntil ?? null,
              },
            },
          }
        : undefined,
    );

    if (!updated) throw userStatusChangedError();
    return updated;
  }

  private async getExistingUser(userId: string) {
    const user = await this.repository.findById(userId);

    if (!user) {
      throw notFoundError();
    }

    return user;
  }
}

export const usersService = new UsersService();
