import type { OrderSummary } from "@cartura/contracts/orders";

import type { OrderWithDetails } from "./orders.types.js";

export function mapOrder(order: OrderWithDetails) {
  const mapped = {
    id: order.id,
    userId: order.userId,
    orderNumber: order.orderNumber,
    status: order.status,
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shippingCost),
    discountAmount: Number(order.discountAmount),
    totalAmount: Number(order.totalAmount),
    currency: order.currency,
    notes: order.notes,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    completedAt: order.completedAt?.toISOString() ?? null,
    cancelledAt: order.cancelledAt?.toISOString() ?? null,
    customer: order.user,
    address: order.address,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      productSku: item.productSku,
      unitPrice: Number(item.unitPrice),
      quantity: item.quantity,
      totalPrice: Number(item.totalPrice),
    })),
    payment: order.payment
      ? {
          id: order.payment.id,
          provider: order.payment.provider,
          providerTransactionId: order.payment.providerTransactionId,
          paymentMethod: order.payment.paymentMethod,
          status: order.payment.status,
          amount: Number(order.payment.amount),
          currency: order.payment.currency,
          failureReason: order.payment.failureReason,
          metadata: order.payment.metadata,
          paidAt: order.payment.paidAt?.toISOString() ?? null,
          refundedAt: order.payment.refundedAt?.toISOString() ?? null,
          createdAt: order.payment.createdAt.toISOString(),
          updatedAt: order.payment.updatedAt.toISOString(),
        }
      : null,
    statusHistory: order.statusHistory.map((entry) => ({
      id: entry.id,
      actorType: entry.actorType,
      changedBy: entry.changedBy,
      previousStatus: entry.previousStatus,
      newStatus: entry.newStatus,
      note: entry.note,
      createdAt: entry.createdAt.toISOString(),
    })),
  };

  mapped satisfies OrderSummary;

  return mapped;
}
