import type { ListOrdersQuery } from "@cartura/contracts/orders";

import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { createPaginatedResult } from "../../shared/pagination/pagination.js";
import {
  awaitingPaymentOrderInclude,
  orderInclude,
} from "./orders.persistence.js";

export class OrdersQueriesRepository {
  findCheckoutByIdempotencyKey(userId: string, idempotencyKey: string) {
    return prisma.order.findFirst({
      where: { userId, payment: { idempotencyKey } },
      include: orderInclude,
    });
  }

  async listForUser(userId: string, query: ListOrdersQuery) {
    const where = buildOrderWhere(query, userId);
    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: orderInclude,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
      prisma.order.count({ where }),
    ]);

    return createPaginatedResult(items, total, query);
  }

  async list(query: ListOrdersQuery) {
    const where = buildOrderWhere(query);
    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: orderInclude,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
      prisma.order.count({ where }),
    ]);

    return createPaginatedResult(items, total, query);
  }

  findForUser(userId: string, orderId: string) {
    return prisma.order.findFirst({
      where: { id: orderId, userId },
      include: orderInclude,
    });
  }

  findById(orderId: string) {
    return prisma.order.findUnique({
      where: { id: orderId },
      include: orderInclude,
    });
  }

  findAwaitingPaymentCandidates(limit: number) {
    return prisma.order.findMany({
      where: { status: "pending", payment: { status: "pending" } },
      include: awaitingPaymentOrderInclude,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: limit,
    });
  }
}

function buildOrderWhere(
  query: ListOrdersQuery,
  userId?: string,
): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = userId ? { userId } : {};

  if (query.status) where.status = query.status;
  if (query.paymentMethod) {
    where.payment = { paymentMethod: query.paymentMethod };
  }
  if (query.q) {
    where.OR = [
      { orderNumber: { contains: query.q, mode: "insensitive" } },
      { user: { email: { contains: query.q, mode: "insensitive" } } },
      { user: { name: { contains: query.q, mode: "insensitive" } } },
    ];
  }

  return where;
}

export const ordersQueriesRepository = new OrdersQueriesRepository();
