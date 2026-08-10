import "server-only";

import {
  listOrdersQuerySchema,
  orderDataResponseSchema,
  paginatedOrderListResponseSchema,
  type ListOrdersQuery,
} from "@cartura/contracts/orders";

import { serverApiFetch } from "@/shared/api/server-api";

export async function listCustomerOrders(
  input: Partial<ListOrdersQuery> = {},
) {
  const query = listOrdersQuerySchema.parse(input);
  const search = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  });

  if (query.status) {
    search.set("status", query.status);
  }
  if (query.paymentMethod) {
    search.set("paymentMethod", query.paymentMethod);
  }
  if (query.q) {
    search.set("q", query.q);
  }

  const payload = await serverApiFetch<unknown>(`/api/v1/orders?${search}`);
  return paginatedOrderListResponseSchema.parse(payload);
}

export async function getCustomerOrder(orderId: string) {
  const payload = await serverApiFetch<unknown>(`/api/v1/orders/${orderId}`);
  return orderDataResponseSchema.parse(payload).data;
}
