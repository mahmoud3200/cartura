import type {
  BuyNowCheckoutRequest,
  CheckoutOrderRequest,
  ListOrdersQuery,
  UpdateOrderStatusRequest,
} from "@cartura/contracts/orders";

import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { conflictError, notFoundError } from "../../shared/errors/index.js";
import { createPaginatedResult } from "../../shared/pagination/pagination.js";
import { auditLogsRepository } from "../audit-logs/audit-logs.repository.js";
import type { AuditContext } from "../audit-logs/audit-logs.types.js";
import { outboxRepository } from "../outbox/index.js";
import {
  getInitialOrderStatus,
  isCashOnDelivery,
  shouldRestoreStockOnCancellation,
} from "./orders.policy.js";
import { createOrderNotificationOutboxEvent } from "./orders.notifications.js";
import type { OrderNotificationIntent } from "./orders.types.js";

export const orderInclude = {
  user: {
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  address: true,
  items: true,
  payment: true,
  statusHistory: { orderBy: { createdAt: "asc" } },
} satisfies Prisma.OrderInclude;

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
            "order.placed",
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
            "order.placed",
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
      metadata: Prisma.InputJsonObject;
      userId: string;
      emailRecipient: string;
      notification: OrderNotificationIntent;
    },
  ) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: { payment: { update: { metadata: input.metadata } } },
        include: orderInclude,
      });
      await outboxRepository.create(
        createOrderNotificationOutboxEvent(
          "order.placed",
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
      await cancelFailedPaymobOrder(checkout.order.id, failureReason, tx);
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
    });
  }

  rollbackBuyNowCheckout(
    checkout: CreatedBuyNowCheckout,
    failureReason: string,
  ) {
    return prisma.$transaction(async (tx) => {
      await cancelFailedPaymobOrder(checkout.order.id, failureReason, tx);
      await restoreOrderStock(checkout.order.items, tx);
    });
  }

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
        orderBy: { createdAt: "desc" },
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
        orderBy: { createdAt: "desc" },
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

  updateStatus(
    current: OrderWithDetails,
    input: UpdateOrderStatusRequest,
    notification: OrderNotificationIntent,
    changedBy?: string,
    audit?: AuditContext,
  ) {
    return prisma.$transaction(async (tx) => {
      const data: Prisma.OrderUpdateInput = {
        status: input.status,
        statusHistory: {
          create: {
            actorType: "staff",
            changedBy: changedBy ?? null,
            previousStatus: current.status,
            newStatus: input.status,
            note: input.note ?? null,
          },
        },
        ...(input.status === "completed" ? { completedAt: new Date() } : {}),
        ...(input.status === "cancelled" ? { cancelledAt: new Date() } : {}),
      };

      await tx.order.update({ where: { id: current.id }, data });

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
            action: "order.status.update",
            resourceType: "order",
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
        createOrderNotificationOutboxEvent(
          "order.status.changed",
          notification,
          {
            orderId: current.id,
            userId: current.userId,
            emailRecipient: current.user.email,
          },
        ),
        tx,
      );

      return tx.order.findUniqueOrThrow({
        where: { id: current.id },
        include: orderInclude,
      });
    });
  }

  findAwaitingPaymentCandidates(limit: number) {
    return prisma.order.findMany({
      where: { status: "pending", payment: { status: "pending" } },
      include: {
        user: { select: { id: true, email: true } },
        items: true,
        payment: true,
      },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
  }

  expireAwaitingPayment(
    orderId: string,
    notification: OrderNotificationIntent,
  ) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          user: { select: { id: true, email: true } },
          items: true,
          payment: true,
        },
      });

      if (
        !current ||
        current.status !== "pending" ||
        current.payment?.status !== "pending"
      ) {
        return false;
      }

      await tx.order.update({
        where: { id: current.id },
        data: {
          status: "cancelled",
          cancelledAt: new Date(),
          statusHistory: {
            create: {
              actorType: "system",
              previousStatus: "pending",
              newStatus: "cancelled",
              note: "Payment window expired",
            },
          },
          payment: {
            update: {
              status: "failed",
              failureReason: "Payment window expired",
            },
          },
        },
      });
      await restoreOrderStock(current.items, tx);
      await auditLogsRepository.create(
        {
          actorType: "system",
          action: "order.expired",
          resourceType: "order",
          resourceId: current.id,
          metadata: {
            orderNumber: current.orderNumber,
            paymentId: current.payment.id,
          },
        },
        tx,
      );
      await outboxRepository.create(
        createOrderNotificationOutboxEvent(
          "order.expired",
          notification,
          {
            orderId: current.id,
            userId: current.userId,
            emailRecipient: current.user.email,
          },
        ),
        tx,
      );

      return true;
    });
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

function buildOrderWhere(
  query: ListOrdersQuery,
  userId?: string,
): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = userId ? { userId } : {};

  if (userId) {
    where.NOT = [
      { status: "pending" },
      {
        status: { in: ["payment_failed", "cancelled"] },
        payment: {
          is: {
            provider: "paymob",
            status: "failed",
          },
        },
      },
    ];
  }

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

function assertAvailableItems(
  items: Array<{
    product: {
      name: string;
      isDeleted: boolean;
      stockQuantity: number;
    };
    quantity: number;
  }>,
): void {
  for (const item of items) {
    if (item.product.isDeleted) {
      throw conflictError(
        "PRODUCT_UNAVAILABLE",
        `${item.product.name} is unavailable`,
      );
    }
    if (item.product.stockQuantity < item.quantity) {
      throw conflictError(
        "INSUFFICIENT_STOCK",
        `${item.product.name} does not have enough stock`,
      );
    }
  }
}

async function decrementStock(
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
  }>,
  tx: Prisma.TransactionClient,
): Promise<void> {
  for (const item of items) {
    const result = await tx.product.updateMany({
      where: {
        id: item.productId,
        stockQuantity: { gte: item.quantity },
      },
      data: { stockQuantity: { decrement: item.quantity } },
    });

    if (result.count !== 1) {
      throw conflictError(
        "INSUFFICIENT_STOCK",
        `${item.productName} does not have enough stock`,
      );
    }
  }
}

async function restoreOrderStock(
  items: Array<{ productId: string; quantity: number }>,
  tx: Prisma.TransactionClient,
): Promise<void> {
  for (const item of items) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stockQuantity: { increment: item.quantity } },
    });
  }
}

async function cancelFailedPaymobOrder(
  orderId: string,
  failureReason: string,
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.order.update({
    where: { id: orderId },
    data: {
      status: "cancelled",
      statusHistory: {
        create: {
          actorType: "system",
          previousStatus: "pending",
          newStatus: "cancelled",
          note: "Paymob intention creation failed",
        },
      },
      payment: {
        update: {
          status: "failed",
          failureReason,
        },
      },
    },
  });
}

export type OrderWithDetails = Prisma.OrderGetPayload<{
  include: typeof orderInclude;
}>;
export type CreatedCartCheckout = Awaited<
  ReturnType<OrdersRepository["createFromCart"]>
>;
export type CreatedBuyNowCheckout = Awaited<
  ReturnType<OrdersRepository["createBuyNow"]>
>;

export const ordersRepository = new OrdersRepository();
