import type {
  ListPaymentWebhookEventsQuery,
} from "@cartura/contracts/payments";

import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { createPaginatedResult } from "../../shared/pagination/pagination.js";
import { outboxService } from "../outbox/index.js";
import { createPaymentStatusNotification } from "./payments.notifications.js";
import type { PaymentWithOrder } from "./payments.types.js";

const paymentInclude = {
  order: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      items: true,
    },
  },
  refunds: true,
} satisfies Prisma.PaymentInclude;

export class PaymentsRepository {
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
        orderBy: { receivedAt: "desc" },
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

  upsertWebhookEvent(input: {
    providerEventId: string;
    paymentId?: string | null;
    payload: unknown;
  }) {
    return prisma.paymentWebhookEvent.upsert({
      where: {
        provider_providerEventId: {
          provider: "paymob",
          providerEventId: input.providerEventId,
        },
      },
      update: {
        attempts: { increment: 1 },
        payload: input.payload as Prisma.InputJsonValue,
      },
      create: {
        paymentId: input.paymentId ?? null,
        provider: "paymob",
        providerEventId: input.providerEventId,
        eventType: "transaction.processed",
        status: "received",
        payload: input.payload as Prisma.InputJsonValue,
      },
    });
  }

  updateWebhookEvent(
    eventId: string,
    data: Prisma.PaymentWebhookEventUpdateInput,
  ) {
    return prisma.paymentWebhookEvent.update({
      where: { id: eventId },
      data,
    });
  }

  async applyWebhookResult(input: {
    payment: PaymentWithOrder;
    eventId: string;
    providerEventId: string;
    transactionId: string;
    paymobOrderId: number | null;
    merchantOrderId: string;
    success: boolean;
    pending: boolean;
    failureReason: string | null;
    nextPaymentStatus: string;
    nextOrderStatus: string;
  }): Promise<void> {
    const { payment } = input;
    const previousPaymentStatus = payment.status;
    const previousOrderStatus = payment.order.status;

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          providerTransactionId:
            input.transactionId || payment.providerTransactionId,
          status: input.nextPaymentStatus,
          failureReason:
            input.nextPaymentStatus === "failed" ? input.failureReason : null,
          paidAt:
            input.nextPaymentStatus === "paid"
              ? (payment.paidAt ?? new Date())
              : payment.paidAt,
          metadata: mergeJsonObject(payment.metadata, {
            paymobOrderId: input.paymobOrderId,
            merchantOrderId: input.merchantOrderId,
            lastWebhookEventId: input.eventId,
            lastPaymobStatus: {
              success: input.success,
              pending: input.pending,
              failureReason: input.failureReason,
            },
          }),
        },
      });

      const orderData: Prisma.OrderUpdateInput = {
        status: input.nextOrderStatus,
      };

      if (previousOrderStatus !== input.nextOrderStatus) {
        orderData.statusHistory = {
          create: {
            actorType: "provider",
            previousStatus: previousOrderStatus,
            newStatus: input.nextOrderStatus,
            note: `Paymob transaction ${input.providerEventId}`,
          },
        };
      }

      await tx.order.update({
        where: { id: payment.orderId },
        data: orderData,
      });

      if (
        input.nextPaymentStatus === "failed" &&
        previousPaymentStatus === "pending"
      ) {
        for (const item of payment.order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { increment: item.quantity } },
          });
        }
      }

      await tx.paymentWebhookEvent.update({
        where: { id: input.eventId },
        data: {
          paymentId: payment.id,
          status: "processed",
          processedAt: new Date(),
          failureReason: null,
        },
      });

      const notification = createPaymentStatusNotification({
        payment,
        previousStatus: previousPaymentStatus,
        nextStatus: input.nextPaymentStatus,
      });

      if (notification) {
        await outboxService.createNotificationEvent(notification, tx);
      }
    });
  }
}

function mergeJsonObject(
  current: Prisma.JsonValue,
  patch: Record<string, unknown>,
): Prisma.InputJsonObject {
  return {
    ...(current && typeof current === "object" && !Array.isArray(current)
      ? (current as Prisma.JsonObject)
      : {}),
    ...patch,
  } as Prisma.InputJsonObject;
}

export const paymentsRepository = new PaymentsRepository();
