import "server-only";

import {
  paginatedRefundListResponseSchema,
  refundDataResponseSchema,
  type CreateRefundRequest,
} from "@cartura/contracts/refunds";

import { serverApiFetch } from "@/shared/api/server-api";

export async function listCustomerRefunds(orderId: string) {
  const search = new URLSearchParams({
    page: "1",
    limit: "30",
    orderId,
  });
  const payload = await serverApiFetch<unknown>(`/api/v1/refunds?${search}`);
  return paginatedRefundListResponseSchema.parse(payload);
}

export async function requestCustomerReturn(input: CreateRefundRequest) {
  const payload = await serverApiFetch<unknown>("/api/v1/refunds", {
    method: "POST",
    json: input,
  });
  return refundDataResponseSchema.parse(payload).data;
}
