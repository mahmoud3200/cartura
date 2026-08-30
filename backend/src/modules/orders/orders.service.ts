import {
  ORDER_CURRENCY,
  type BuyNowCheckoutRequest,
  type CheckoutOrderRequest,
  type ListOrdersQuery,
  type UpdateOrderStatusRequest,
} from "@cartura/contracts/orders";

import {
  getPaymobCheckoutConfigurationIssue,
  getPaymobCardIntegrationId,
  paymobConfig,
} from "../../config/paymob.js";
import { env } from "../../config/env.js";
import { paymobClient } from "../../infrastructure/payments/paymob.client.js";
import {
  conflictError,
  httpError,
  notFoundError,
} from "../../shared/errors/index.js";
import type { AuditContext } from "../audit-logs/audit-logs.types.js";
import { mapOrderLinesToPaymobItems } from "./orders.paymob.js";
import {
  createExpiredOrderNotification,
  createOrderPlacedNotification,
  createOrderStatusNotification,
} from "./orders.notifications.js";
import {
  assertOrderCancellationAllowed,
  assertOrderFulfillmentAllowed,
  assertOrderTransition,
  isCashOnDelivery,
} from "./orders.policy.js";
import {
  ordersRepository,
  type CreatedBuyNowCheckout,
  type CreatedCartCheckout,
  type OrderWithDetails,
  type OrdersRepository,
} from "./orders.repository.js";
import {
  createOrderNumber,
  getCheckoutExpiresAt,
  getDateFromJson,
  getStringFromJson,
  toMinorUnits,
} from "./orders.utils.js";

type CreatedCheckout = CreatedCartCheckout | CreatedBuyNowCheckout;

export class OrdersService {
  constructor(
    private readonly repository: OrdersRepository = ordersRepository,
  ) {}

  async checkout(userId: string, input: CheckoutOrderRequest) {
    const setup = await this.prepareCheckout(userId, input);

    if (setup.existing) {
      return setup.existing;
    }

    const orderNumber = createOrderNumber();
    const created = await this.repository.createFromCart(userId, input, {
      currency: setup.currency,
      idempotencyKey: setup.idempotencyKey,
      cashOnDelivery: setup.cashOnDelivery,
      integrationId: setup.integrationId,
      orderNumber,
      checkoutExpiresAt: getCheckoutExpiresAt(),
      notification: createOrderPlacedNotification({
        orderNumber,
        cashOnDelivery: setup.cashOnDelivery,
      }),
    });

    if (setup.cashOnDelivery) {
      return { order: created.order, checkoutUrl: null };
    }

    return this.finalizePaymobCheckout(
      created,
      userId,
      setup.currency,
      setup.integrationId!,
      () =>
        this.repository.rollbackCartCheckout(
          created,
          "Paymob intention creation failed",
        ),
    );
  }

  async buyNow(userId: string, input: BuyNowCheckoutRequest) {
    const setup = await this.prepareCheckout(userId, input);

    if (setup.existing) {
      return setup.existing;
    }

    const orderNumber = createOrderNumber();
    const created = await this.repository.createBuyNow(userId, input, {
      currency: setup.currency,
      idempotencyKey: setup.idempotencyKey,
      cashOnDelivery: setup.cashOnDelivery,
      integrationId: setup.integrationId,
      orderNumber,
      checkoutExpiresAt: getCheckoutExpiresAt(),
      notification: createOrderPlacedNotification({
        orderNumber,
        cashOnDelivery: setup.cashOnDelivery,
      }),
    });

    if (setup.cashOnDelivery) {
      return { order: created.order, checkoutUrl: null };
    }

    return this.finalizePaymobCheckout(
      created,
      userId,
      setup.currency,
      setup.integrationId!,
      () =>
        this.repository.rollbackBuyNowCheckout(
          created,
          "Paymob intention creation failed",
        ),
    );
  }

  async findCheckoutByIdempotencyKey(
    userId: string,
    idempotencyKey: string,
  ): Promise<{ order: OrderWithDetails; checkoutUrl: string | null } | null> {
    const order = await this.repository.findCheckoutByIdempotencyKey(
      userId,
      idempotencyKey,
    );

    if (!order) {
      return null;
    }

    const checkoutUrl = getStringFromJson(
      order.payment?.metadata,
      "checkoutUrl",
    );

    if (
      !isCashOnDelivery(order.payment?.paymentMethod ?? "") &&
      (order.status === "cancelled" || order.payment?.status === "failed")
    ) {
      throw conflictError(
        "CHECKOUT_PREVIOUSLY_FAILED",
        "This checkout attempt has already failed or expired",
      );
    }

    if (!checkoutUrl && !isCashOnDelivery(order.payment?.paymentMethod ?? "")) {
      throw conflictError(
        "CHECKOUT_IN_PROGRESS",
        "Checkout is already being initialized",
      );
    }

    return { order, checkoutUrl };
  }

  listForUser(userId: string, query: ListOrdersQuery) {
    return this.repository.listForUser(userId, query);
  }

  list(query: ListOrdersQuery) {
    return this.repository.list(query);
  }

  async getForUser(userId: string, orderId: string) {
    const order = await this.repository.findForUser(userId, orderId);

    if (!order) {
      throw notFoundError("ORDER_NOT_FOUND", "Order not found");
    }

    return order;
  }

  async get(orderId: string) {
    const order = await this.repository.findById(orderId);

    if (!order) {
      throw notFoundError("ORDER_NOT_FOUND", "Order not found");
    }

    return order;
  }

  async updateStatus(
    orderId: string,
    input: UpdateOrderStatusRequest,
    changedBy?: string,
    audit?: AuditContext,
  ) {
    const current = await this.get(orderId);

    if (current.status === input.status) {
      return current;
    }

    assertOrderTransition(current.status, input.status);
    assertOrderFulfillmentAllowed({
      nextStatus: input.status,
      paymentMethod: current.payment?.paymentMethod,
      paymentStatus: current.payment?.status,
    });

    if (input.status === "cancelled") {
      assertOrderCancellationAllowed({
        paymentMethod: current.payment?.paymentMethod,
        paymentStatus: current.payment?.status,
      });
    }

    return this.repository.updateStatus(
      current,
      input,
      createOrderStatusNotification({
        orderNumber: current.orderNumber,
        status: input.status,
      }),
      changedBy,
      audit,
    );
  }

  async cancelExpiredAwaitingPaymentOrders(
    limit = env.STALE_ORDER_BATCH_SIZE,
  ): Promise<number> {
    const candidates =
      await this.repository.findAwaitingPaymentCandidates(limit);
    let cancelled = 0;

    for (const order of candidates) {
      const checkoutExpiresAt = getDateFromJson(
        order.payment?.metadata,
        "checkoutExpiresAt",
      );

      if (!checkoutExpiresAt || checkoutExpiresAt > new Date()) {
        continue;
      }

      if (
        await this.repository.expireAwaitingPayment(
          order,
          createExpiredOrderNotification(order.orderNumber),
        )
      ) {
        cancelled += 1;
      }
    }

    return cancelled;
  }

  private async prepareCheckout(
    userId: string,
    input: CheckoutOrderRequest | BuyNowCheckoutRequest,
  ) {
    const currency = ORDER_CURRENCY;
    const idempotencyKey = `checkout:${userId}:${input.idempotencyKey}`;
    const existing = await this.findCheckoutByIdempotencyKey(
      userId,
      idempotencyKey,
    );
    const cashOnDelivery = isCashOnDelivery(input.paymentMethod);

    if (existing) {
      return {
        currency,
        idempotencyKey,
        existing,
        cashOnDelivery: isCashOnDelivery(
          existing.order.payment?.paymentMethod ?? input.paymentMethod,
        ),
        integrationId: null,
      };
    }

    if (cashOnDelivery) {
      return {
        currency,
        idempotencyKey,
        existing,
        cashOnDelivery,
        integrationId: null,
      };
    }

    const configurationIssue =
      getPaymobCheckoutConfigurationIssue(currency);

    if (configurationIssue) {
      throw httpError(
        503,
        configurationIssue.code,
        configurationIssue.message,
      );
    }

    const integrationId = getPaymobCardIntegrationId(currency);

    if (!integrationId) {
      throw httpError(
        503,
        "PAYMOB_INTEGRATION_NOT_CONFIGURED",
        `Paymob card integration ID is not configured for ${currency}`,
      );
    }

    return {
      currency,
      idempotencyKey,
      existing,
      cashOnDelivery,
      integrationId,
    };
  }

  private async finalizePaymobCheckout(
    created: CreatedCheckout,
    userId: string,
    currency: string,
    integrationId: number,
    rollback: () => Promise<unknown>,
  ) {
    try {
      const billingData = {
        first_name: created.user.firstName,
        last_name: created.user.lastName,
        email: created.user.email,
        phone_number: created.address.phoneNumber,
        country: created.address.country,
        city: created.address.city,
        state: created.address.area,
        street: created.address.streetAddress,
        ...(created.address.postalCode
          ? { postal_code: created.address.postalCode }
          : {}),
      };
      const intentionInput = {
        amount: toMinorUnits(created.payment.amount),
        currency,
        paymentMethods: [integrationId],
        items: mapOrderLinesToPaymobItems(created.order.items),
        billingData,
        specialReference: created.order.orderNumber,
        extras: {
          orderId: created.order.id,
          paymentId: created.payment.id,
        },
        ...(paymobConfig.webhookUrl
          ? { notificationUrl: paymobConfig.webhookUrl }
          : {}),
        ...(paymobConfig.redirectionUrl
          ? { redirectionUrl: paymobConfig.redirectionUrl }
          : {}),
      };
      const intention = await paymobClient.createIntention(intentionInput);
      const paymobOrderId =
        intention.intention_order_id ??
        intention.payment_keys?.find((key) => key.order_id)?.order_id;
      const checkoutUrl = paymobClient.getUnifiedCheckoutUrl(
        intention.client_secret,
      );
      const order = await this.repository.attachPaymobIntention(
        created.order.id,
        {
          paymentId: created.payment.id,
          expectedPaymentUpdatedAt: created.payment.updatedAt,
          metadata: {
            integrationId,
            orderNumber: created.order.orderNumber,
            paymobIntentionId: intention.id,
            ...(paymobOrderId === undefined ? {} : { paymobOrderId }),
            paymobStatus: intention.status,
            checkoutUrl,
            checkoutExpiresAt: getCheckoutExpiresAt().toISOString(),
          },
          userId,
          emailRecipient: created.user.email,
          notification: createOrderPlacedNotification({
            orderNumber: created.order.orderNumber,
            cashOnDelivery: false,
          }),
        },
      );

      if (!order) {
        throw conflictError(
          "CHECKOUT_NO_LONGER_PENDING",
          "Checkout expired before the payment session was attached",
        );
      }

      return { order, checkoutUrl };
    } catch (error) {
      await rollback();
      throw error;
    }
  }

}

export const ordersService = new OrdersService();
