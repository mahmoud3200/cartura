import "server-only";

import {
  paymentWebhookEventSchema,
  reprocessPaymentWebhookResponseSchema,
  type ListPaymentWebhookEventsQuery,
} from "@cartura/contracts/payments";

import {
  fetchManagementData,
  fetchManagementPaginated,
  type ManagementPaginationInput,
} from "@/features/management/shared/api/management-api";

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
    reprocessPaymentWebhookResponseSchema,
    { method: "POST" },
  );
}
