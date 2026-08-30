import type { ListPaymentWebhookEventsQuery } from "@cartura/contracts/payments";

import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { createPaginatedResult } from "../../shared/pagination/pagination.js";
import {
  paymentInclude,
  type PaymentWithOrder,
} from "./payments.persistence.js";

export class PaymentsQueriesRepository {
  getForUser(userId: string, paymentId: string) {
    return prisma.payment.findFirst({
      where: {
        id: paymentId,
        order: { userId },
      },
      include: paymentInclude,
    });
  }

  async listWebhookEvents(query: ListPaymentWebhookEventsQuery) {
    const where: Prisma.PaymentWebhookEventWhereInput = {};

    if (query.status) where.status = query.status;
    if (query.provider) where.provider = query.provider;
    if (query.paymentId) where.paymentId = query.paymentId;
    const [items, totalItems] = await Promise.all([
      prisma.paymentWebhookEvent.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: [{ receivedAt: "desc" }, { id: "desc" }],
      }),
      prisma.paymentWebhookEvent.count({ where }),
    ]);

    return createPaginatedResult(items, totalItems, query);
  }

  getWebhookEvent(eventId: string) {
    return prisma.paymentWebhookEvent.findUnique({
      where: { id: eventId },
    });
  }

  findPaymobPayment(
    paymobOrderId: number | null,
    merchantOrderId: string,
  ): Promise<PaymentWithOrder | null> {
    if (paymobOrderId === null && !merchantOrderId) {
      return Promise.resolve(null);
    }

    return prisma.payment.findFirst({
      where: {
        provider: "paymob",
        ...(paymobOrderId === null
          ? {}
          : {
              metadata: {
                path: ["paymobOrderId"],
                equals: paymobOrderId,
              },
            }),
        ...(merchantOrderId
          ? { order: { orderNumber: merchantOrderId } }
          : {}),
      },
      include: paymentInclude,
    });
  }
}

export const paymentsQueriesRepository = new PaymentsQueriesRepository();
