import "server-only";

import {
  orderSummarySchema,
  type ListOrdersQuery,
  type OrderSummary,
  type UpdateOrderStatusRequest,
} from "@cartura/contracts/orders";

import {
  fetchManagementData,
  fetchManagementPaginated,
  type ManagementPaginationInput,
} from "@/features/management/shared/api/management-api";
export type ManagementOrder = OrderSummary;

export async function listManagementOrders(
  input: ManagementPaginationInput &
    Pick<ListOrdersQuery, "q" | "status" | "paymentMethod">,
) {
  return fetchManagementPaginated(
    "/api/v1/management/orders",
    orderSummarySchema,
    input,
    {
      q: input.q,
      status: input.status,
      paymentMethod: input.paymentMethod,
    },
  );
}

export function updateManagementOrderStatus(
  orderId: string,
  input: UpdateOrderStatusRequest,
) {
  return fetchManagementData(
    `/api/v1/management/orders/${encodeURIComponent(orderId)}/status`,
    orderSummarySchema,
    { method: "PATCH", json: input },
  );
}
