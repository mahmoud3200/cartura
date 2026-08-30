import type {
  CreateRefundRequest,
  ListRefundsQuery,
  RefundStatus,
  ReviewRefundRequest,
} from "@cartura/contracts/refunds";
import {
  AUDIT_ACTIONS,
  AUDIT_RESOURCE_TYPES,
  type AuditAction,
} from "@cartura/contracts/audit-logs";

import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { createPaginatedResult } from "../../shared/pagination/pagination.js";
import { auditLogsRepository } from "../audit-logs/audit-logs.repository.js";
import type { AuditContext } from "../audit-logs/audit-logs.types.js";
import { outboxRepository } from "../outbox/index.js";
import { createRefundNotificationOutboxEvent } from "./refunds.notifications.js";
import {
  RefundPersistenceConflictError,
  type RefundPersistenceConflictKind,
} from "./refunds.persistence-errors.js";

export const refundInclude = {
  initiator: {
    select: { id: true, name: true, email: true },
  },
  reviewer: {
    select: { id: true, name: true, email: true },
  },
  payment: {
    include: {
      refunds: {
        select: {
          status: true,
          reviewedAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
      order: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          address: true,
          items: true,
        },
      },
    },
  },
} satisfies Prisma.RefundInclude;

export type RefundWithDetails = Prisma.RefundGetPayload<{
  include: typeof refundInclude;
}>;

const activeRefundStatuses = [
  "requested",
  "approved",
  "pickup_scheduled",
  "item_received",
  "processing",
  "completed",
  "failed",
] satisfies RefundStatus[];

const MAX_SERIALIZABLE_TRANSACTION_ATTEMPTS = 3;

export class RefundsRepository {
  async list(query: ListRefundsQuery, userId?: string) {
    const where = buildRefundWhere(query, userId);
    const [items, totalItems] = await Promise.all([
      prisma.refund.findMany({
        where,
        include: refundInclude,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
      prisma.refund.count({ where }),
    ]);

    return createPaginatedResult(items, totalItems, query);
  }

  findOrderForRequest(userId: string, orderId: string) {
    return prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        address: true,
        items: true,
        payment: {
          include: {
            refunds: { orderBy: { createdAt: "desc" } },
          },
        },
      },
    });
  }

  async getRemainingRefundAmount(paymentId: string) {
    const payment = await prisma.payment.findUniqueOrThrow({
      where: { id: paymentId },
      select: {
        amount: true,
        refunds: {
          where: { status: { not: "rejected" } },
          select: { amount: true },
        },
      },
    });

    return payment.refunds.reduce(
      (remaining, refund) => remaining.minus(refund.amount),
      payment.amount,
    );
  }

  async createRequested(input: {
    userId: string;
    request: CreateRefundRequest;
    paymentId: string;
    amount: Prisma.Decimal;
    currency: string;
    refundMethod: "card" | "cash";
    audit?: AuditContext;
  }) {
    return runSerializableRefundTransaction(async (tx) => {
      const existing = await tx.refund.findFirst({
        where: {
          paymentId: input.paymentId,
          status: { in: activeRefundStatuses },
        },
        select: { id: true },
      });

      if (existing) {
        throw new RefundPersistenceConflictError("active_request");
      }

      const refund = await tx.refund.create({
        data: {
          paymentId: input.paymentId,
          initiatedBy: input.userId,
          amount: input.amount,
          currency: input.currency,
          status: "requested",
          reasonCode: input.request.reason,
          reason: input.request.note ?? null,
          refundMethod: input.refundMethod,
        },
        include: refundInclude,
      });

      await recordAudit(
        tx,
        input.audit,
        AUDIT_ACTIONS.REFUND_REQUESTED,
        refund.id,
        {
          orderId: refund.payment.orderId,
          paymentId: refund.paymentId,
          reason: input.request.reason,
        },
      );
      await notify(tx, refund, "requested");

      return refund;
    }, "request_concurrent");
  }

  findById(refundId: string) {
    return prisma.refund.findUnique({
      where: { id: refundId },
      include: refundInclude,
    });
  }

  findProcessingForPayment(paymentId: string) {
    return prisma.refund.findFirst({
      where: { paymentId, status: "processing", refundMethod: "card" },
      include: refundInclude,
      orderBy: { updatedAt: "desc" },
    });
  }

  review(
    current: RefundWithDetails,
    input: ReviewRefundRequest,
    reviewerId: string,
    audit?: AuditContext,
  ) {
    return prisma.$transaction(async (tx) => {
      const approved = input.decision === "approve";
      const pickup = approved && input.resolution === "pickup";
      const status = approved
        ? pickup
          ? "pickup_scheduled"
          : "approved"
        : "rejected";
      const pickupScheduledAt =
        pickup && input.pickupScheduledAt
          ? new Date(input.pickupScheduledAt)
          : null;
      const updated = await tx.refund.updateMany({
        where: { id: current.id, status: "requested" },
        data: {
          status,
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          reviewNote: input.reviewNote ?? null,
          resolution: approved ? input.resolution : null,
          pickupScheduledAt,
          failureReason: null,
        },
      });

      if (updated.count !== 1) {
        throw new RefundPersistenceConflictError("already_reviewed");
      }

      const refund = await tx.refund.findUniqueOrThrow({
        where: { id: current.id },
        include: refundInclude,
      });
      await recordAudit(tx, audit, getReviewAuditAction(status), refund.id, {
        orderId: refund.payment.orderId,
        resolution: refund.resolution,
      });
      await notify(tx, refund, status);

      return refund;
    });
  }

  confirmItemReceived(
    current: RefundWithDetails,
    note: string | undefined,
    actorId: string,
    audit?: AuditContext,
  ) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.refund.updateMany({
        where: {
          id: current.id,
          status: "pickup_scheduled",
          resolution: "pickup",
        },
        data: {
          status: "item_received",
          itemReceivedAt: new Date(),
          reviewNote: note ?? current.reviewNote,
          failureReason: null,
        },
      });

      if (updated.count !== 1) {
        throw new RefundPersistenceConflictError("item_not_receivable");
      }

      for (const item of current.payment.order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } },
        });
      }

      const refund = await tx.refund.findUniqueOrThrow({
        where: { id: current.id },
        include: refundInclude,
      });
      await recordAudit(tx, audit, AUDIT_ACTIONS.REFUND_ITEM_RECEIVED, refund.id, {
        orderId: refund.payment.orderId,
        restockedBy: actorId,
      });
      await notify(tx, refund, "item_received");

      return refund;
    });
  }

  async markProcessing(refundId: string): Promise<RefundWithDetails> {
    const updated = await prisma.refund.updateMany({
      where: {
        id: refundId,
        status: { in: ["approved", "item_received", "failed"] },
      },
      data: {
        status: "processing",
        failureReason: null,
        failedAt: null,
      },
    });

    if (updated.count !== 1) {
      throw new RefundPersistenceConflictError("not_executable");
    }

    return prisma.refund.findUniqueOrThrow({
      where: { id: refundId },
      include: refundInclude,
    });
  }

  async resetExecution(refundId: string, status: "approved" | "item_received") {
    await prisma.refund.updateMany({
      where: { id: refundId, status: "processing" },
      data: { status, failureReason: null, failedAt: null },
    });

    return prisma.refund.findUniqueOrThrow({
      where: { id: refundId },
      include: refundInclude,
    });
  }

  markProviderPending(
    current: RefundWithDetails,
    providerRefundId: string | null,
    audit?: AuditContext,
  ) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.refund.updateMany({
        where: { id: current.id, status: "processing" },
        data: { providerRefundId, failureReason: null },
      });

      const refund = await tx.refund.findUniqueOrThrow({
        where: { id: current.id },
        include: refundInclude,
      });

      if (updated.count !== 1) return refund;
      await recordAudit(tx, audit, AUDIT_ACTIONS.REFUND_PROCESSING, refund.id, {
        orderId: refund.payment.orderId,
        providerRefundId,
      });
      await notify(tx, refund, "processing");
      return refund;
    });
  }

  async complete(
    current: RefundWithDetails,
    providerRefundId: string | null,
    audit?: AuditContext,
    paymentWebhookClaim?: { eventId: string; claimToken: string },
  ) {
    return runSerializableRefundTransaction(async (tx) => {
      // Every refund completion for a payment takes the same row lock. This
      // makes the completed-sum and the resulting payment/order status one
      // serialized decision, even when different refunds finish together.
      const payment = await tx.payment.update({
        where: { id: current.paymentId },
        data: { updatedAt: new Date() },
        include: { order: true },
      });
      const updated = await tx.refund.updateMany({
        where: { id: current.id, status: "processing" },
        data: {
          status: "completed",
          providerRefundId,
          failureReason: null,
          completedAt: new Date(),
          failedAt: null,
        },
      });

      if (updated.count !== 1) {
        const existing = await tx.refund.findUniqueOrThrow({
          where: { id: current.id },
          include: refundInclude,
        });

        if (existing.status === "completed") {
          if (paymentWebhookClaim) {
            await completePaymentWebhookEvent(
              tx,
              paymentWebhookClaim,
              current.paymentId,
            );
          }
          return existing;
        }

        throw new RefundPersistenceConflictError("not_processing");
      }

      const completed = await tx.refund.aggregate({
        where: { paymentId: current.paymentId, status: "completed" },
        _sum: { amount: true },
      });
      const refundedAmount = completed._sum.amount ?? new Prisma.Decimal(0);
      const fullyRefunded = refundedAmount.gte(payment.amount);
      const orderStatus = fullyRefunded ? "refunded" : "partially_refunded";

      await tx.payment.update({
        where: { id: current.paymentId },
        data: {
          status: orderStatus,
          refundedAt: fullyRefunded ? new Date() : null,
        },
      });

      if (payment.order.status !== orderStatus) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            status: orderStatus,
            statusHistory: {
              create: {
                actorType: "system",
                previousStatus: payment.order.status,
                newStatus: orderStatus,
                note: `Refund ${current.id} completed`,
              },
            },
          },
        });
      }

      const refund = await tx.refund.findUniqueOrThrow({
        where: { id: current.id },
        include: refundInclude,
      });
      await recordAudit(tx, audit, AUDIT_ACTIONS.REFUND_COMPLETED, refund.id, {
        orderId: refund.payment.orderId,
        paymentStatus: orderStatus,
        providerRefundId,
      });
      await notify(tx, refund, "completed");

      if (paymentWebhookClaim) {
        await completePaymentWebhookEvent(
          tx,
          paymentWebhookClaim,
          current.paymentId,
        );
      }

      return refund;
    }, "completion_concurrent");
  }

  fail(current: RefundWithDetails, reason: string, audit?: AuditContext) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.refund.updateMany({
        where: { id: current.id, status: "processing" },
        data: {
          status: "failed",
          failureReason: reason,
          failedAt: new Date(),
        },
      });

      const refund = await tx.refund.findUniqueOrThrow({
        where: { id: current.id },
        include: refundInclude,
      });

      if (updated.count !== 1) return refund;
      await recordAudit(tx, audit, AUDIT_ACTIONS.REFUND_FAILED, refund.id, {
        orderId: refund.payment.orderId,
        reason,
      });
      await notify(tx, refund, "failed");
      return refund;
    });
  }

  recordExecutionUncertainty(
    current: RefundWithDetails,
    reason: string,
    audit?: AuditContext,
  ) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.refund.updateMany({
        where: { id: current.id, status: "processing" },
        data: { failureReason: reason },
      });
      const refund = await tx.refund.findUniqueOrThrow({
        where: { id: current.id },
        include: refundInclude,
      });

      if (updated.count !== 1) return refund;

      await recordAudit(tx, audit, AUDIT_ACTIONS.REFUND_EXECUTION_UNCERTAIN, refund.id, {
        orderId: refund.payment.orderId,
        reason,
      });
      await notify(tx, refund, "processing");
      return refund;
    });
  }
}

function buildRefundWhere(
  query: ListRefundsQuery,
  userId?: string,
): Prisma.RefundWhereInput {
  const where: Prisma.RefundWhereInput = {};
  if (query.status) where.status = query.status;
  if (query.paymentId) where.paymentId = query.paymentId;
  if (query.orderId || userId) {
    where.payment = {
      order: {
        ...(query.orderId ? { id: query.orderId } : {}),
        ...(userId ? { userId } : {}),
      },
    };
  }
  return where;
}

function getReviewAuditAction(
  status: "approved" | "pickup_scheduled" | "rejected",
): AuditAction {
  switch (status) {
    case "approved":
      return AUDIT_ACTIONS.REFUND_APPROVED;
    case "pickup_scheduled":
      return AUDIT_ACTIONS.REFUND_PICKUP_SCHEDULED;
    case "rejected":
      return AUDIT_ACTIONS.REFUND_REJECTED;
  }
}

async function recordAudit(
  tx: Prisma.TransactionClient,
  audit: AuditContext | undefined,
  action: AuditAction,
  refundId: string,
  metadata: Prisma.InputJsonObject,
) {
  await auditLogsRepository.create(
    {
      ...(audit ?? { actorType: "system" }),
      action,
      resourceType: AUDIT_RESOURCE_TYPES.REFUND,
      resourceId: refundId,
      metadata,
    },
    tx,
  );
}

async function completePaymentWebhookEvent(
  tx: Prisma.TransactionClient,
  claim: { eventId: string; claimToken: string },
  paymentId: string,
) {
  const event = await tx.paymentWebhookEvent.updateMany({
    where: {
      id: claim.eventId,
      status: "processing",
      claimToken: claim.claimToken,
    },
    data: {
      paymentId,
      status: "processed",
      processedAt: new Date(),
      failureReason: null,
      claimToken: null,
      claimedAt: null,
    },
  });

  if (event.count !== 1) {
    throw new RefundPersistenceConflictError("webhook_claim_lost");
  }
}

function notify(
  tx: Prisma.TransactionClient,
  refund: RefundWithDetails,
  status: RefundStatus,
) {
  return outboxRepository.create(
    createRefundNotificationOutboxEvent({
      refundId: refund.id,
      orderId: refund.payment.orderId,
      orderNumber: refund.payment.order.orderNumber,
      userId: refund.payment.order.userId,
      email: refund.payment.order.user.email,
      status,
      pickupScheduledAt: refund.pickupScheduledAt,
    }),
    tx,
  );
}

export const refundsRepository = new RefundsRepository();

async function runSerializableRefundTransaction<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
  conflict: RefundPersistenceConflictKind,
): Promise<T> {
  return retryRefundSerializableTransaction(
    () => prisma.$transaction(operation, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }),
    conflict,
  );
}

export async function retryRefundSerializableTransaction<T>(
  execute: () => Promise<T>,
  conflict: RefundPersistenceConflictKind,
): Promise<T> {
  for (
    let attempt = 1;
    attempt <= MAX_SERIALIZABLE_TRANSACTION_ATTEMPTS;
    attempt += 1
  ) {
    try {
      return await execute();
    } catch (error) {
      if (!hasPrismaErrorCode(error, "P2034")) throw error;
      if (attempt === MAX_SERIALIZABLE_TRANSACTION_ATTEMPTS) {
        throw new RefundPersistenceConflictError(conflict);
      }
    }
  }

  throw new RefundPersistenceConflictError(conflict);
}

function hasPrismaErrorCode(error: unknown, code: string): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === code,
  );
}
