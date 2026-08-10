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

const userInclude = {
  assignedRole: {
    include: {
      role: true,
    },
  },
} satisfies Prisma.UserInclude;

export class UsersRepository {
  findAccountAccessById(userId: string) {
    return prisma.user.findUnique({
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
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: [{ createdAt: "desc" }],
        include: userInclude,
      }),
      prisma.user.count({ where }),
    ]);

    return createPaginatedResult(items, total, query);
  }

  findById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: userInclude,
    });
  }

  updateStatus(
    userId: string,
    input: UpdateUserStatusRequest,
    audit?: RecordAuditLogInput,
  ) {
    const data = buildStatusUpdateData(input);

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data,
        include: userInclude,
      });

      if (audit) {
        await auditLogsRepository.create(audit, tx);
      }

      return user;
    });
  }

  activate(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        accountStatus: "active",
        accountStatusReason: null,
        suspendedUntil: null,
      },
      include: userInclude,
    });
  }

  activateExpiredSuspensions(now = new Date()) {
    return prisma.user.updateMany({
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
): Prisma.UserUpdateInput {
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
