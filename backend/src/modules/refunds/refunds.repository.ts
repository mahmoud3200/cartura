import type {
  CreateRefundRequest,
  ListRefundsQuery,
  ReviewRefundRequest,
} from "@cartura/contracts/refunds";

import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { conflictError, notFoundError } from "../../shared/errors/index.js";
import { createPaginatedResult } from "../../shared/pagination/pagination.js";
import { auditLogsRepository } from "../audit-logs/audit-logs.repository.js";
import type { AuditContext } from "../audit-logs/audit-logs.types.js";
import { outboxRepository } from "../outbox/index.js";
import { createRefundNotificationOutboxEvent } from "./refunds.notifications.js";

export const refundInclude = {
  initiator: {
    select: { id: true, name: true, email: true },
  },
  reviewer: {
    select: { id: true, name: true, email: true },
  },
  payment: {
    include: {
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
];

export class RefundsRepository {
  async list(query: ListRefundsQuery, userId?: string) {
    const where = buildRefundWhere(query, userId);
    const [items, totalItems] = await Promise.all([
      prisma.refund.findMany({
        where,
        include: refundInclude,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: "desc" },
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

  createRequested(input: {
    userId: string;
    request: CreateRefundRequest;
    paymentId: string;
    amount: Prisma.Decimal;
    currency: string;
    refundMethod: "card" | "cash";
    audit?: AuditContext;
  }) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.refund.findFirst({
        where: {
          paymentId: input.paymentId,
          status: { in: activeRefundStatuses },
        },
        select: { id: true },
      });

      if (existing) {
        throw conflictError(
          "REFUND_ALREADY_REQUESTED",
          "This order already has an active return or refund",
        );
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
        "refund.requested",
        refund.id,
        {
          orderId: refund.payment.orderId,
          paymentId: refund.paymentId,
          reason: input.request.reason,
        },
      );
      await notify(tx, refund, "requested");

      return refund;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
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
        throw conflictError(
          "REFUND_ALREADY_REVIEWED",
          "This return request has already been reviewed",
        );
      }

      const refund = await tx.refund.findUniqueOrThrow({
        where: { id: current.id },
        include: refundInclude,
      });
      await recordAudit(tx, audit, `refund.${status}`, refund.id, {
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
        throw conflictError(
          "REFUND_ITEM_NOT_RECEIVABLE",
          "This return is not waiting for a pickup",
        );
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
      await recordAudit(tx, audit, "refund.item_received", refund.id, {
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
        status: { in: ["approved", "item_received"] },
      },
      data: {
        status: "processing",
        failureReason: null,
        failedAt: null,
      },
    });

    if (updated.count !== 1) {
      throw conflictError(
        "REFUND_NOT_EXECUTABLE",
        "This refund is not ready to be issued",
      );
    }

    return prisma.refund.findUniqueOrThrow({
      where: { id: refundId },
      include: refundInclude,
    });
  }

  resetExecution(refundId: string, status: "approved" | "item_received") {
    return prisma.refund.update({
      where: { id: refundId },
      data: { status, failureReason: null, failedAt: null },
      include: refundInclude,
    });
  }

  markProviderPending(
    current: RefundWithDetails,
    providerRefundId: string | null,
    audit?: AuditContext,
  ) {
    return prisma.$transaction(async (tx) => {
      const refund = await tx.refund.update({
        where: { id: current.id },
        data: { providerRefundId },
        include: refundInclude,
      });
      await recordAudit(tx, audit, "refund.processing", refund.id, {
        orderId: refund.payment.orderId,
        providerRefundId,
      });
      await notify(tx, refund, "processing");
      return refund;
    });
  }

  complete(
    current: RefundWithDetails,
    providerRefundId: string | null,
    audit?: AuditContext,
  ) {
    return prisma.$transaction(async (tx) => {
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
          return existing;
        }

        throw conflictError(
          "REFUND_NOT_PROCESSING",
          "This refund is no longer processing",
        );
      }

      const completed = await tx.refund.aggregate({
        where: { paymentId: current.paymentId, status: "completed" },
        _sum: { amount: true },
      });
      const refundedAmount = completed._sum.amount ?? new Prisma.Decimal(0);
      const fullyRefunded = refundedAmount.gte(current.payment.amount);
      const orderStatus = fullyRefunded ? "refunded" : "partially_refunded";

      await tx.payment.update({
        where: { id: current.paymentId },
        data: {
          status: orderStatus,
          refundedAt: fullyRefunded ? new Date() : null,
        },
      });

      if (current.payment.order.status !== orderStatus) {
        await tx.order.update({
          where: { id: current.payment.orderId },
          data: {
            status: orderStatus,
            statusHistory: {
              create: {
                actorType: "system",
                previousStatus: current.payment.order.status,
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
      await recordAudit(tx, audit, "refund.completed", refund.id, {
        orderId: refund.payment.orderId,
        paymentStatus: orderStatus,
        providerRefundId,
      });
      await notify(tx, refund, "completed");

      return refund;
    });
  }

  fail(current: RefundWithDetails, reason: string, audit?: AuditContext) {
    return prisma.$transaction(async (tx) => {
      const refund = await tx.refund.update({
        where: { id: current.id },
        data: {
          status: "failed",
          failureReason: reason,
          failedAt: new Date(),
        },
        include: refundInclude,
      });
      await recordAudit(tx, audit, "refund.failed", refund.id, {
        orderId: refund.payment.orderId,
        reason,
      });
      await notify(tx, refund, "failed");
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

async function recordAudit(
  tx: Prisma.TransactionClient,
  audit: AuditContext | undefined,
  action: string,
  refundId: string,
  metadata: Prisma.InputJsonObject,
) {
  await auditLogsRepository.create(
    {
      ...(audit ?? { actorType: "system" }),
      action,
      resourceType: "refund",
      resourceId: refundId,
      metadata,
    },
    tx,
  );
}

function notify(
  tx: Prisma.TransactionClient,
  refund: RefundWithDetails,
  status: string,
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
