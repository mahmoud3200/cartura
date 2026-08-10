import type {
  ListUsersQuery,
  UpdateUserStatusRequest,
} from "@cartura/contracts/users";

import type { AuditContext } from "../audit-logs/audit-logs.types.js";
import { isExpiredSuspension } from "./users.utils.js";
import {
  accountDisabledError,
  accountSuspendedError,
  cantBanSuperAdminError,
  cantSelfBanError,
  notFoundError,
} from "./users.errors.js";
import { usersRepository, type UsersRepository } from "./users.repository.js";
import { isSuperAdmin } from "./users.utils.js";

export class UsersService {
  constructor(private readonly repository: UsersRepository = usersRepository) {}

  async assertAccountCanAccess(userId: string) {
    const user = await this.repository.findAccountAccessById(userId);

    if (!user) {
      throw notFoundError();
    }

    if (isExpiredSuspension(user)) {
      await this.repository.activate(userId);
      return;
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
      return this.repository.activate(userId);
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

    if (userDoingTheRequest === userId) {
      throw cantSelfBanError();
    }

    return this.repository.updateStatus(
      userId,
      input,
      audit
        ? {
            ...audit,
            action: "user.status.update",
            resourceType: "user",
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
