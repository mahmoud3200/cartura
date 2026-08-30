import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { auditLogsRepository } from "../audit-logs/audit-logs.repository.js";
import type { RecordAuditLogInput } from "../audit-logs/audit-logs.types.js";
import { outboxRepository } from "../outbox/index.js";
import { createPaymentStatusNotification } from "./payments.notifications.js";
import type { PaymentWithOrder } from "./payments.persistence.js";

export class PaymentWebhookStateChangedError extends Error {}

export class PaymentWebhooksRepository {
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
        ...(input.paymentId ? { paymentId: input.paymentId } : {}),
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

  async claimWebhookEvent(input: {
    eventId: string;
    claimToken: string;
    claimedAt: Date;
    staleBefore: Date;
    force: boolean;
  }) {
    const claimed = await prisma.paymentWebhookEvent.updateMany({
      where: {
        id: input.eventId,
        processedAt: null,
        OR: [
          {
            status: {
              in: input.force
                ? ["received", "failed", "manual_review"]
                : ["received", "failed"],
            },
          },
          {
            status: "processing",
            OR: [
              { claimedAt: null },
              { claimedAt: { lte: input.staleBefore } },
            ],
          },
        ],
      },
      data: {
        status: "processing",
        attempts: { increment: 1 },
        claimToken: input.claimToken,
        claimedAt: input.claimedAt,
      },
    });

    return claimed.count === 1;
  }

  releaseWebhookClaim(eventId: string, claimToken: string) {
    return prisma.paymentWebhookEvent.updateMany({
      where: { id: eventId, status: "processing", claimToken },
      data: { status: "received", claimToken: null, claimedAt: null },
    });
  }

  async finishWebhookEvent(
    input: {
      eventId: string;
      claimToken: string;
      paymentId?: string | null;
      status: "processed" | "failed";
      processedAt?: Date | null;
      failureReason: string | null;
    },
    tx: Prisma.TransactionClient | typeof prisma = prisma,
  ) {
    const updated = await tx.paymentWebhookEvent.updateMany({
      where: {
        id: input.eventId,
        status: "processing",
        claimToken: input.claimToken,
      },
      data: {
        ...(input.paymentId !== undefined
          ? { paymentId: input.paymentId }
          : {}),
        status: input.status,
        ...(input.processedAt !== undefined
          ? { processedAt: input.processedAt }
          : {}),
        failureReason: input.failureReason,
        claimToken: null,
        claimedAt: null,
      },
    });

    if (updated.count !== 1) throw new PaymentWebhookStateChangedError();
  }

  markWebhookForManualReview(input: {
    eventId: string;
    claimToken: string;
    paymentId: string;
    reason: string;
    audit: RecordAuditLogInput;
  }) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.paymentWebhookEvent.updateMany({
        where: {
          id: input.eventId,
          status: "processing",
          claimToken: input.claimToken,
        },
        data: {
          paymentId: input.paymentId,
          status: "manual_review",
          failureReason: input.reason,
          claimToken: null,
          claimedAt: null,
        },
      });

      if (updated.count !== 1) throw new PaymentWebhookStateChangedError();
      await auditLogsRepository.create(input.audit, tx);
    });
  }

  async applyWebhookResult(input: {
    payment: PaymentWithOrder;
    eventId: string;
    claimToken: string;
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
      const paymentUpdate = await tx.payment.updateMany({
        where: {
          id: payment.id,
          status: previousPaymentStatus,
          updatedAt: payment.updatedAt,
        },
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

      if (paymentUpdate.count !== 1) {
        throw new PaymentWebhookStateChangedError();
      }

      const orderUpdate = await tx.order.updateMany({
        where: { id: payment.orderId, status: previousOrderStatus },
        data: {
          status: input.nextOrderStatus,
          ...(input.nextOrderStatus === "cancelled"
            ? { cancelledAt: new Date() }
            : {}),
        },
      });

      if (orderUpdate.count !== 1) {
        throw new PaymentWebhookStateChangedError();
      }

      if (previousOrderStatus !== input.nextOrderStatus) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.orderId,
            actorType: "provider",
            previousStatus: previousOrderStatus,
            newStatus: input.nextOrderStatus,
            note: `Paymob transaction ${input.providerEventId}`,
          },
        });
      }

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

      await this.finishWebhookEvent(
        {
          eventId: input.eventId,
          claimToken: input.claimToken,
          paymentId: payment.id,
          status: "processed",
          processedAt: new Date(),
          failureReason: null,
        },
        tx,
      );

      const notification = createPaymentStatusNotification({
        payment,
        previousStatus: previousPaymentStatus,
        nextStatus: input.nextPaymentStatus,
      });

      if (notification) {
        await outboxRepository.create(notification, tx);
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

export const paymentWebhooksRepository = new PaymentWebhooksRepository();
