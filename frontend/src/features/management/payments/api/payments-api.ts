import "server-only";

import {
  paymentWebhookEventSchema,
  type ListPaymentWebhookEventsQuery,
  type PaymentWebhookEvent,
} from "@cartura/contracts/payments";

import {
  fetchManagementData,
  fetchManagementPaginated,
  type ManagementPaginationInput,
} from "@/features/management/shared/api/management-api";
import { z } from "zod";

export type ManagementWebhookEvent = PaymentWebhookEvent;

export async function listManagementWebhookEvents(
  input: ManagementPaginationInput &
    Pick<ListPaymentWebhookEventsQuery, "status" | "provider" | "paymentId">,
) {
  return fetchManagementPaginated(
    "/api/v1/management/payments/webhook-events",
    paymentWebhookEventSchema,
    input,
    {
      status: input.status,
      provider: input.provider,
      paymentId: input.paymentId,
    },
  );
}

export function reprocessManagementWebhookEvent(eventId: string) {
  return fetchManagementData(
    `/api/v1/management/payments/webhook-events/${encodeURIComponent(eventId)}/reprocess`,
    z.object({
      matched: z.boolean(),
      duplicate: z.boolean().optional(),
      manualReview: z.boolean().optional(),
    }),
    { method: "POST" },
  );
}
