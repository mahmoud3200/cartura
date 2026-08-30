import type {
  BuyNowCheckoutRequest,
  CheckoutOrderRequest,
  ListOrdersQuery,
  UpdateOrderStatusRequest,
} from "@cartura/contracts/orders";

import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { conflictError, notFoundError } from "../../shared/errors/index.js";
import type { AuditContext } from "../audit-logs/audit-logs.types.js";
import { outboxRepository } from "../outbox/index.js";
import {
  assertAvailableItems,
  decrementStock,
  restoreOrderStock,
} from "./orders.inventory.repository.js";
import {
  ordersLifecycleRepository,
  type OrdersLifecycleRepository,
} from "./orders.lifecycle.repository.js";
import {
  getInitialOrderStatus,
} from "./orders.policy.js";
import { createOrderNotificationOutboxEvent } from "./orders.notifications.js";
import {
  orderInclude,
  type AwaitingPaymentOrder,
  type OrderWithDetails,
} from "./orders.persistence.js";
import {
  ordersQueriesRepository,
  type OrdersQueriesRepository,
} from "./orders.queries.repository.js";
import type { OrderNotificationIntent } from "./orders.types.js";

type CheckoutPersistence = {
  currency: string;
  idempotencyKey: string;
  cashOnDelivery: boolean;
  integrationId: number | null;
  orderNumber: string;
  checkoutExpiresAt: Date;
  notification: OrderNotificationIntent;
};

export class OrdersRepository {
  constructor(
    private readonly queries: OrdersQueriesRepository = ordersQueriesRepository,
    private readonly lifecycle: OrdersLifecycleRepository = ordersLifecycleRepository,
  ) {}
  createFromCart(
    userId: string,
    input: CheckoutOrderRequest,
    persistence: CheckoutPersistence,
  ) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      });
      const address = await tx.address.findFirst({
        where: { id: input.addressId, userId },
      });
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: true } } },
      });

      if (!user) throw notFoundError("USER_NOT_FOUND", "User not found");
      if (!address) {
        throw notFoundError("ADDRESS_NOT_FOUND", "Address not found");
      }
      if (!cart || cart.items.length === 0) {
        throw conflictError("CART_EMPTY", "Cart is empty");
      }

      assertAvailableItems(
        cart.items.map((item) => ({
          product: item.product,
          quantity: item.quantity,
        })),
      );

      const subtotal = cart.items.reduce(
        (sum, item) =>
          sum.plus(new Prisma.Decimal(item.product.price).mul(item.quantity)),
        new Prisma.Decimal(0),
      );
      const totalAmount = subtotal;
      const initialOrderStatus = getInitialOrderStatus(input.paymentMethod);
      const order = await tx.order.create({
        data: {
          userId,
          orderNumber: persistence.orderNumber,
          status: initialOrderStatus,
          subtotal,
          shippingCost: 0,
          discountAmount: 0,
          totalAmount,
          currency: persistence.currency,
          notes: input.notes ?? null,
          address: {
            create: {
              recipientName: address.recipientName,
              phoneNumber: address.phoneNumber,
              country: address.country,
              city: address.city,
              area: address.area,
              streetAddress: address.streetAddress,
              postalCode: address.postalCode,
            },
          },
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              productSku: item.product.sku,
              unitPrice: item.product.price,
              quantity: item.quantity,
              totalPrice: new Prisma.Decimal(item.product.price).mul(
                item.quantity,
              ),
            })),
          },
          statusHistory: {
            create: {
              actorType: "customer",
              changedBy: userId,
              previousStatus: null,
              newStatus: initialOrderStatus,
              note: "Order created from checkout",
            },
          },
        },
        include: orderInclude,
      });

      await decrementStock(
        cart.items.map((item) => ({
          productId: item.productId,
          productName: item.product.name,
          quantity: item.quantity,
        })),
        tx,
      );
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          provider: persistence.cashOnDelivery
            ? "cash_on_delivery"
            : "paymob",
          idempotencyKey: persistence.idempotencyKey,
          paymentMethod: input.paymentMethod,
          status: "pending",
          amount: totalAmount,
          currency: persistence.currency,
          metadata: createInitialPaymentMetadata(persistence),
        },
      });

      if (persistence.cashOnDelivery) {
        await outboxRepository.create(
          createOrderNotificationOutboxEvent(
            persistence.notification,
            {
              orderId: order.id,
              userId,
              emailRecipient: user.email,
            },
          ),
          tx,
        );
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return {
        order: { ...order, payment },
        payment,
        cartId: cart.id,
        address,
        user,
      };
    });
  }

  createBuyNow(
    userId: string,
    input: BuyNowCheckoutRequest,
    persistence: CheckoutPersistence,
  ) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      });
      const address = await tx.address.findFirst({
        where: { id: input.addressId, userId },
      });
      const product = await tx.product.findUnique({
        where: { id: input.productId },
      });

      if (!user) throw notFoundError("USER_NOT_FOUND", "User not found");
      if (!address) {
        throw notFoundError("ADDRESS_NOT_FOUND", "Address not found");
      }
      if (!product) {
        throw notFoundError("PRODUCT_NOT_FOUND", "Product not found");
      }

      assertAvailableItems([{ product, quantity: input.quantity }]);

      const subtotal = new Prisma.Decimal(product.price).mul(input.quantity);
      const initialOrderStatus = getInitialOrderStatus(input.paymentMethod);
      const order = await tx.order.create({
        data: {
          userId,
          orderNumber: persistence.orderNumber,
          status: initialOrderStatus,
          subtotal,
          shippingCost: 0,
          discountAmount: 0,
          totalAmount: subtotal,
          currency: persistence.currency,
          notes: input.notes ?? null,
          address: {
            create: {
              recipientName: address.recipientName,
              phoneNumber: address.phoneNumber,
              country: address.country,
              city: address.city,
              area: address.area,
              streetAddress: address.streetAddress,
              postalCode: address.postalCode,
            },
          },
          items: {
            create: {
              productId: product.id,
              productName: product.name,
              productSku: product.sku,
              unitPrice: product.price,
              quantity: input.quantity,
              totalPrice: subtotal,
            },
          },
          statusHistory: {
            create: {
              actorType: "customer",
              changedBy: userId,
              previousStatus: null,
              newStatus: initialOrderStatus,
              note: "Order created from buy now",
            },
          },
        },
        include: orderInclude,
      });

      await decrementStock(
        [
          {
            productId: product.id,
            productName: product.name,
            quantity: input.quantity,
          },
        ],
        tx,
      );
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          provider: persistence.cashOnDelivery
            ? "cash_on_delivery"
            : "paymob",
          idempotencyKey: persistence.idempotencyKey,
          paymentMethod: input.paymentMethod,
          status: "pending",
          amount: subtotal,
          currency: persistence.currency,
          metadata: createInitialPaymentMetadata(persistence),
        },
      });

      if (persistence.cashOnDelivery) {
        await outboxRepository.create(
          createOrderNotificationOutboxEvent(
            persistence.notification,
            {
              orderId: order.id,
              userId,
              emailRecipient: user.email,
            },
          ),
          tx,
        );
      }

      return { order: { ...order, payment }, payment, address, user };
    });
  }

  attachPaymobIntention(
    orderId: string,
    input: {
      paymentId: string;
      expectedPaymentUpdatedAt: Date;
      metadata: Prisma.InputJsonObject;
      userId: string;
      emailRecipient: string;
      notification: OrderNotificationIntent;
    },
  ) {
    return prisma.$transaction(async (tx) => {
      const attached = await tx.payment.updateMany({
        where: {
          id: input.paymentId,
          orderId,
          status: "pending",
          updatedAt: input.expectedPaymentUpdatedAt,
          order: { status: "pending" },
        },
        data: { metadata: input.metadata },
      });

      if (attached.count !== 1) return null;

      const order = await tx.order.findUniqueOrThrow({
        where: { id: orderId },
        include: orderInclude,
      });
      await outboxRepository.create(
        createOrderNotificationOutboxEvent(
          input.notification,
          {
            orderId: order.id,
            userId: input.userId,
            emailRecipient: input.emailRecipient,
          },
        ),
        tx,
      );

      return order;
    });
  }

  rollbackCartCheckout(
    checkout: CreatedCartCheckout,
    failureReason: string,
  ) {
    return prisma.$transaction(async (tx) => {
      const cancelled = await cancelFailedPaymobOrder(
        checkout.order.id,
        failureReason,
        tx,
      );
      if (!cancelled) return false;
      await restoreOrderStock(checkout.order.items, tx);

      for (const item of checkout.order.items) {
        await tx.cartItem.upsert({
          where: {
            cartId_productId: {
              cartId: checkout.cartId,
              productId: item.productId,
            },
          },
          create: {
            cartId: checkout.cartId,
            productId: item.productId,
            quantity: item.quantity,
          },
          update: { quantity: { increment: item.quantity } },
        });
      }

      return true;
    });
  }

  rollbackBuyNowCheckout(
    checkout: CreatedBuyNowCheckout,
    failureReason: string,
  ) {
    return prisma.$transaction(async (tx) => {
      const cancelled = await cancelFailedPaymobOrder(
        checkout.order.id,
        failureReason,
        tx,
      );
      if (!cancelled) return false;
      await restoreOrderStock(checkout.order.items, tx);
      return true;
    });
  }

  findCheckoutByIdempotencyKey(userId: string, idempotencyKey: string) {
    return this.queries.findCheckoutByIdempotencyKey(userId, idempotencyKey);
  }

  listForUser(userId: string, query: ListOrdersQuery) {
    return this.queries.listForUser(userId, query);
  }

  list(query: ListOrdersQuery) {
    return this.queries.list(query);
  }

  findForUser(userId: string, orderId: string) {
    return this.queries.findForUser(userId, orderId);
  }

  findById(orderId: string) {
    return this.queries.findById(orderId);
  }

  updateStatus(
    current: OrderWithDetails,
    input: UpdateOrderStatusRequest,
    notification: OrderNotificationIntent,
    changedBy?: string,
    audit?: AuditContext,
  ) {
    return this.lifecycle.updateStatus(
      current,
      input,
      notification,
      changedBy,
      audit,
    );
  }

  findAwaitingPaymentCandidates(limit: number) {
    return this.queries.findAwaitingPaymentCandidates(limit);
  }

  async expireAwaitingPayment(
    current: AwaitingPaymentOrder,
    notification: OrderNotificationIntent,
  ) {
    return this.lifecycle.expireAwaitingPayment(current, notification);
  }
}

function createInitialPaymentMetadata(
  persistence: CheckoutPersistence,
): Prisma.InputJsonObject {
  return persistence.cashOnDelivery
    ? {
        orderNumber: persistence.orderNumber,
        collection: "on_delivery",
      }
    : {
        integrationId: persistence.integrationId,
        orderNumber: persistence.orderNumber,
        checkoutExpiresAt: persistence.checkoutExpiresAt.toISOString(),
      };
}

async function cancelFailedPaymobOrder(
  orderId: string,
  failureReason: string,
  tx: Prisma.TransactionClient,
): Promise<boolean> {
  const payment = await tx.payment.updateMany({
    where: { orderId, status: "pending", order: { status: "pending" } },
    data: {
      status: "failed",
      failureReason,
    },
  });

  if (payment.count !== 1) return false;

  const order = await tx.order.updateMany({
    where: { id: orderId, status: "pending" },
    data: { status: "cancelled", cancelledAt: new Date() },
  });

  if (order.count !== 1) {
    await tx.payment.updateMany({
      where: { orderId, status: "failed", failureReason },
      data: { status: "pending", failureReason: null },
    });
    return false;
  }

  await tx.orderStatusHistory.create({
    data: {
      orderId,
      actorType: "system",
      previousStatus: "pending",
      newStatus: "cancelled",
      note: "Paymob intention creation failed",
    },
  });

  return true;
}

export type CreatedCartCheckout = Awaited<
  ReturnType<OrdersRepository["createFromCart"]>
>;
export type CreatedBuyNowCheckout = Awaited<
  ReturnType<OrdersRepository["createBuyNow"]>
>;
export type {
  AwaitingPaymentOrder,
  OrderWithDetails,
} from "./orders.persistence.js";

export const ordersRepository = new OrdersRepository();
