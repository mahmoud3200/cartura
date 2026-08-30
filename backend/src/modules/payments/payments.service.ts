import type { ListPaymentWebhookEventsQuery } from "@cartura/contracts/payments";
import {
  AUDIT_ACTIONS,
  AUDIT_RESOURCE_TYPES,
} from "@cartura/contracts/audit-logs";

import { conflictError, notFoundError } from "../../shared/errors/index.js";
import { auditLogsRepository } from "../audit-logs/audit-logs.repository.js";
import type { AuditContext } from "../audit-logs/audit-logs.types.js";
import {
  paymentsRepository,
  type PaymentsRepository,
} from "./payments.repository.js";
import {
  paymobWebhookService,
  type PaymobWebhookService,
} from "./payments.webhook.service.js";

/** Coordinates customer/management payment reads with the Paymob workflow. */
export class PaymentsService {
  constructor(
    private readonly repository: PaymentsRepository = paymentsRepository,
    private readonly webhooks: PaymobWebhookService = paymobWebhookService,
  ) {}

  async getForUser(userId: string, paymentId: string) {
    const payment = await this.repository.getForUser(userId, paymentId);

    if (!payment) {
      throw notFoundError("PAYMENT_NOT_FOUND", "Payment not found");
    }

    return payment;
  }

  handlePaymobWebhook(payload: unknown, hmac?: string) {
    return this.webhooks.process(payload, { hmac });
  }

  listWebhookEvents(query: ListPaymentWebhookEventsQuery) {
    return this.repository.listWebhookEvents(query);
  }

  async getWebhookEvent(eventId: string) {
    const event = await this.repository.getWebhookEvent(eventId);

    if (!event) {
      throw notFoundError(
        "PAYMENT_WEBHOOK_EVENT_NOT_FOUND",
        "Webhook event not found",
      );
    }

    return event;
  }

  async reprocessWebhookEvent(eventId: string, audit?: AuditContext) {
    const event = await this.getWebhookEvent(eventId);

    if (event.processedAt) {
      throw conflictError(
        "PAYMENT_WEBHOOK_EVENT_ALREADY_PROCESSED",
        "Webhook event has already been processed",
      );
    }

    const result = await this.webhooks.process(event.payload, {
      skipHmac: true,
      force: true,
    });

    if (audit) {
      await auditLogsRepository.create({
        ...audit,
        action: AUDIT_ACTIONS.PAYMENT_WEBHOOK_REPROCESS,
        resourceType: AUDIT_RESOURCE_TYPES.PAYMENT_WEBHOOK_EVENT,
        resourceId: event.id,
        metadata: {
          provider: event.provider,
          providerEventId: event.providerEventId,
          result,
        },
      });
    }

    return result;
  }
}

export const paymentsService = new PaymentsService();
