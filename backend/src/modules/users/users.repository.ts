import type {
  ListUsersQuery,
  UpdateUserStatusRequest,
} from "@cartura/contracts/users";

import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { auditLogsRepository } from "../audit-logs/audit-logs.repository.js";
import type { RecordAuditLogInput } from "../audit-logs/audit-logs.types.js";
import {
  createPaginatedResult,
  getPaginationParams,
} from "../../shared/pagination/pagination.js";

export const userInclude = {
  assignedRole: {
    include: {
      role: true,
    },
  },
} satisfies Prisma.UserInclude;

export type UserWithRelations = Prisma.UserGetPayload<{
  include: typeof userInclude;
}>;

export class UsersRepository {
  constructor(private readonly database: typeof prisma = prisma) {}

  findAccountAccessById(userId: string) {
    return this.database.user.findUnique({
      where: { id: userId },
      select: {
        accountStatus: true,
        accountStatusReason: true,
        suspendedUntil: true,
      },
    });
  }

  async list(query: ListUsersQuery) {
    const where = buildUserWhere(query);
    const { skip, take } = getPaginationParams(query);

    const [items, total] = await Promise.all([
      this.database.user.findMany({
        where,
        skip,
        take,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        include: userInclude,
      }),
      this.database.user.count({ where }),
    ]);

    return createPaginatedResult(items, total, query);
  }

  findById(userId: string) {
    return this.database.user.findUnique({
      where: { id: userId },
      include: userInclude,
    });
  }

  updateStatus(
    userId: string,
    input: UpdateUserStatusRequest,
    expected: { updatedAt: Date; assignedRoleId: string | null },
    audit?: RecordAuditLogInput,
  ) {
    const data = buildStatusUpdateData(input);

    return this.database.$transaction(async (tx) => {
      const updated = await tx.user.updateMany({
        where: {
          id: userId,
          updatedAt: expected.updatedAt,
          assignedRole: expected.assignedRoleId
            ? { is: { roleId: expected.assignedRoleId } }
            : { is: null },
        },
        data,
      });

      if (updated.count !== 1) return null;

      if (input.accountStatus !== "active") {
        await tx.authSession.deleteMany({ where: { userId } });
      }

      if (audit) {
        await auditLogsRepository.create(audit, tx);
      }

      return tx.user.findUniqueOrThrow({
        where: { id: userId },
        include: userInclude,
      });
    });
  }

  async activateExpired(
    userId: string,
    expectedSuspendedUntil: Date,
    now = new Date(),
  ) {
    const updated = await this.database.user.updateMany({
      where: {
        id: userId,
        accountStatus: "suspended",
        suspendedUntil: { equals: expectedSuspendedUntil, lte: now },
      },
      data: {
        accountStatus: "active",
        accountStatusReason: null,
        suspendedUntil: null,
      },
    });

    return updated.count === 1;
  }

  activateExpiredSuspensions(now = new Date()) {
    return this.database.user.updateMany({
      where: {
        accountStatus: "suspended",
        suspendedUntil: {
          lte: now,
        },
      },
      data: {
        accountStatus: "active",
        accountStatusReason: null,
        suspendedUntil: null,
      },
    });
  }
}

function buildUserWhere(query: ListUsersQuery): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};

  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { firstName: { contains: query.q, mode: "insensitive" } },
      { lastName: { contains: query.q, mode: "insensitive" } },
      { email: { contains: query.q, mode: "insensitive" } },
    ];
  }

  if (query.accountStatus !== undefined) {
    where.accountStatus = query.accountStatus;
  }

  if (query.emailVerified !== undefined) {
    where.emailVerified = query.emailVerified;
  }

  return where;
}

function buildStatusUpdateData(
  input: UpdateUserStatusRequest,
): Prisma.UserUpdateManyMutationInput {
  if (input.accountStatus === "active") {
    return {
      accountStatus: "active",
      accountStatusReason: null,
      suspendedUntil: null,
    };
  }

  if (input.accountStatus === "disabled") {
    return {
      accountStatus: "disabled",
      accountStatusReason: input.statusReason ?? null,
      suspendedUntil: null,
    };
  }

  return {
    accountStatus: "suspended",
    accountStatusReason: input.statusReason ?? null,
    suspendedUntil: new Date(input.suspendedUntil ?? ""),
  };
}

export const usersRepository = new UsersRepository();
