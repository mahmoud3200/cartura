import { env } from "../../config/env.js";
import {
  createTransactionalEmail,
  type TransactionalEmail,
} from "../../infrastructure/mail/index.js";

export function createNotificationEmail(input: {
  type?: string;
  title: string;
  body: string;
  data?: unknown;
}): TransactionalEmail {
  const data = asRecord(input.data);
  const orderId = getString(data.orderId);
  const orderNumber = getString(data.orderNumber);
  const action = orderId
    ? {
        label: getActionLabel(input.type),
        url: new URL(
          `/settings/orders/${encodeURIComponent(orderId)}`,
          env.FRONTEND_URL,
        ).toString(),
      }
    : undefined;

  return createTransactionalEmail({
    subject: input.title,
    preheader: input.body,
    heading: input.title,
    body: input.body,
    ...(action ? { action } : {}),
    ...(orderNumber
      ? { details: [{ label: "Order number", value: orderNumber }] }
      : {}),
  });
}

function getActionLabel(type: string | undefined) {
  if (type === "payment.failed") {
    return "Review payment";
  }

  if (type?.startsWith("refund.")) {
    return "Review refund";
  }

  return "View order";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function getString(value: unknown) {
  return typeof value === "string" && value ? value : null;
}
