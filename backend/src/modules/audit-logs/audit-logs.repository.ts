import type {
  ListAuditLogsQuery,
} from "@cartura/contracts/audit-logs";

import type { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import {
  createPaginatedResult,
  getPaginationParams,
} from "../../shared/pagination/pagination.js";
import type { RecordAuditLogInput } from "./audit-logs.types.js";

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export const auditLogInclude = {
  actor: {
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
} satisfies Prisma.AuditLogInclude;

export class AuditLogsRepository {
  async list(query: ListAuditLogsQuery) {
    const where = buildAuditLogWhere(query);
    const { skip, take } = getPaginationParams(query);

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        include: auditLogInclude,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return createPaginatedResult(items, total, query);
  }

  async create(input: RecordAuditLogInput, client: PrismaExecutor = prisma) {
    const actorSnapshot = input.actorUserId
      ? await client.user.findUnique({
          where: { id: input.actorUserId },
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        })
      : null;
    const data: Prisma.AuditLogUncheckedCreateInput = {
      actorUserId: input.actorUserId ?? null,
      actorType: input.actorType,
      actorIdSnapshot: actorSnapshot?.id ?? null,
      actorNameSnapshot: actorSnapshot?.name ?? null,
      actorFirstNameSnapshot: actorSnapshot?.firstName ?? null,
      actorLastNameSnapshot: actorSnapshot?.lastName ?? null,
      actorEmailSnapshot: actorSnapshot?.email ?? null,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? null,
      requestId: input.requestId ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    };

    if (input.metadata !== undefined) {
      data.metadata = input.metadata;
    }

    return client.auditLog.create({
      data,
      include: auditLogInclude,
    });
  }
}

export function buildAuditLogWhere(
  query: ListAuditLogsQuery,
): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {};

  if (query.actorUserId !== undefined) where.actorUserId = query.actorUserId;
  if (query.actorType !== undefined) where.actorType = query.actorType;
  if (query.action !== undefined) where.action = query.action;

  if (query.q !== undefined) {
    where.OR = [
      { actorType: { contains: query.q, mode: "insensitive" } },
      { actorNameSnapshot: { contains: query.q, mode: "insensitive" } },
      { actorFirstNameSnapshot: { contains: query.q, mode: "insensitive" } },
      { actorLastNameSnapshot: { contains: query.q, mode: "insensitive" } },
      { actorEmailSnapshot: { contains: query.q, mode: "insensitive" } },
      {
        actor: {
          is: {
            OR: [
              { name: { contains: query.q, mode: "insensitive" } },
              { firstName: { contains: query.q, mode: "insensitive" } },
              { lastName: { contains: query.q, mode: "insensitive" } },
              { email: { contains: query.q, mode: "insensitive" } },
            ],
          },
        },
      },
    ];
  }
  if (query.resourceType !== undefined) where.resourceType = query.resourceType;
  if (query.resourceId !== undefined) where.resourceId = query.resourceId;

  if (query.from !== undefined || query.to !== undefined) {
    where.createdAt = {};

    if (query.from !== undefined) {
      where.createdAt.gte = new Date(query.from);
    }

    if (query.to !== undefined) {
      where.createdAt.lte = new Date(query.to);
    }
  }

  return where;
}

export const auditLogsRepository = new AuditLogsRepository();

export type AuditLogWithActor = Prisma.AuditLogGetPayload<{
  include: typeof auditLogInclude;
}>;
