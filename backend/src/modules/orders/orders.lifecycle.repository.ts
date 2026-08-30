import type { UpdateOrderStatusRequest } from "@cartura/contracts/orders";
import {
  AUDIT_ACTIONS,
  AUDIT_RESOURCE_TYPES,
} from "@cartura/contracts/audit-logs";

import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { conflictError } from "../../shared/errors/index.js";
import { auditLogsRepository } from "../audit-logs/audit-logs.repository.js";
import type { AuditContext } from "../audit-logs/audit-logs.types.js";
import { outboxRepository } from "../outbox/index.js";
import { restoreOrderStock } from "./orders.inventory.repository.js";
import { createOrderNotificationOutboxEvent } from "./orders.notifications.js";
import {
  orderInclude,
  type AwaitingPaymentOrder,
  type OrderWithDetails,
} from "./orders.persistence.js";
import {
  isCashOnDelivery,
  shouldRestoreStockOnCancellation,
} from "./orders.policy.js";
import type { OrderNotificationIntent } from "./orders.types.js";

class OrderClaimLostError extends Error {}

export class OrdersLifecycleRepository {
  updateStatus(
    current: OrderWithDetails,
    input: UpdateOrderStatusRequest,
    notification: OrderNotificationIntent,
    changedBy?: string,
    audit?: AuditContext,
  ) {
    return prisma.$transaction(async (tx) => {
      if (current.payment) {
        const paymentClaim = await tx.payment.updateMany({
          where: {
            id: current.payment.id,
            status: current.payment.status,
            updatedAt: current.payment.updatedAt,
          },
          data: { updatedAt: new Date() },
        });

        if (paymentClaim.count !== 1) {
          throw conflictError(
            "ORDER_CHANGED",
            "The order payment changed while the status was being updated",
          );
        }
      }

      const data: Prisma.OrderUpdateManyMutationInput = {
        status: input.status,
        ...(input.status === "completed" ? { completedAt: new Date() } : {}),
        ...(input.status === "cancelled" ? { cancelledAt: new Date() } : {}),
      };
      const orderClaim = await tx.order.updateMany({
        where: { id: current.id, status: current.status },
        data,
      });

      if (orderClaim.count !== 1) {
        throw conflictError(
          "ORDER_CHANGED",
          "The order changed while the status was being updated",
        );
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: current.id,
          actorType: "staff",
          changedBy: changedBy ?? null,
          previousStatus: current.status,
          newStatus: input.status,
          note: input.note ?? null,
        },
      });

      if (
        input.status === "cancelled" &&
        shouldRestoreStockOnCancellation({
          previousOrderStatus: current.status,
          paymentStatus: current.payment?.status,
        })
      ) {
        await restoreOrderStock(current.items, tx);
      }

      if (input.status === "cancelled" && current.payment) {
        await tx.payment.update({
          where: { orderId: current.id },
          data: isCashOnDelivery(current.payment.paymentMethod)
            ? {
                status: "cancelled",
                failureReason: "Cash on delivery order cancelled",
              }
            : {
                status: "failed",
                failureReason: "Order cancelled before payment",
              },
        });
      }

      if (
        input.status === "completed" &&
        current.payment &&
        isCashOnDelivery(current.payment.paymentMethod)
      ) {
        await tx.payment.update({
          where: { orderId: current.id },
          data: {
            status: "paid",
            paidAt: new Date(),
            failureReason: null,
          },
        });
      }

      if (audit) {
        await auditLogsRepository.create(
          {
            ...audit,
            action: AUDIT_ACTIONS.ORDER_STATUS_UPDATE,
            resourceType: AUDIT_RESOURCE_TYPES.ORDER,
            resourceId: current.id,
            metadata: {
              previousStatus: current.status,
              newStatus: input.status,
              note: input.note ?? null,
            },
          },
          tx,
        );
      }

      await outboxRepository.create(
        createOrderNotificationOutboxEvent(notification, {
          orderId: current.id,
          userId: current.userId,
          emailRecipient: current.user.email,
        }),
        tx,
      );

      return tx.order.findUniqueOrThrow({
        where: { id: current.id },
        include: orderInclude,
      });
    });
  }

  async expireAwaitingPayment(
    current: AwaitingPaymentOrder,
    notification: OrderNotificationIntent,
  ) {
    const payment = current.payment;
    if (!payment) return false;

    try {
      return await prisma.$transaction(async (tx) => {
        const paymentClaim = await tx.payment.updateMany({
          where: {
            id: payment.id,
            status: "pending",
            updatedAt: payment.updatedAt,
            order: { status: "pending" },
          },
          data: {
            status: "failed",
            failureReason: "Payment window expired",
          },
        });

        if (paymentClaim.count !== 1) throw new OrderClaimLostError();

        const orderClaim = await tx.order.updateMany({
          where: { id: current.id, status: "pending" },
          data: { status: "cancelled", cancelledAt: new Date() },
        });

        if (orderClaim.count !== 1) throw new OrderClaimLostError();

        await tx.orderStatusHistory.create({
          data: {
            orderId: current.id,
            actorType: "system",
            previousStatus: "pending",
            newStatus: "cancelled",
            note: "Payment window expired",
          },
        });
        await restoreOrderStock(current.items, tx);
        await auditLogsRepository.create(
          {
            actorType: "system",
            action: AUDIT_ACTIONS.ORDER_EXPIRED,
            resourceType: AUDIT_RESOURCE_TYPES.ORDER,
            resourceId: current.id,
            metadata: {
              orderNumber: current.orderNumber,
              paymentId: payment.id,
            },
          },
          tx,
        );
        await outboxRepository.create(
          createOrderNotificationOutboxEvent(notification, {
            orderId: current.id,
            userId: current.userId,
            emailRecipient: current.user.email,
          }),
          tx,
        );

        return true;
      });
    } catch (error) {
      if (error instanceof OrderClaimLostError) return false;
      throw error;
    }
  }
}

export const ordersLifecycleRepository = new OrdersLifecycleRepository();
