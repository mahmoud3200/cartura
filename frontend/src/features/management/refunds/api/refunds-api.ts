import "server-only";

import {
  refundSchema,
  type ConfirmRefundItemReceivedRequest,
  type ListRefundsQuery,
  type ReviewRefundRequest,
} from "@cartura/contracts/refunds";

import {
  fetchManagementPaginated,
  fetchManagementData,
  type ManagementPaginationInput,
} from "@/features/management/shared/api/management-api";
export async function listManagementRefunds(
  input: ManagementPaginationInput &
    Pick<ListRefundsQuery, "status" | "paymentId" | "orderId">,
) {
  return fetchManagementPaginated(
    "/api/v1/management/refunds",
    refundSchema,
    input,
    {
      status: input.status,
      paymentId: input.paymentId,
      orderId: input.orderId,
    },
  );
}

export function executeManagementRefund(refundId: string) {
  return fetchManagementData(
    `/api/v1/management/refunds/${encodeURIComponent(refundId)}/execute`,
    refundSchema,
    { method: "POST" },
  );
}

export function reviewManagementRefund(
  refundId: string,
  input: ReviewRefundRequest,
) {
  return fetchManagementData(
    `/api/v1/management/refunds/${encodeURIComponent(refundId)}/review`,
    refundSchema,
    { method: "POST", json: input },
  );
}

export function confirmManagementRefundItemReceived(
  refundId: string,
  input: ConfirmRefundItemReceivedRequest,
) {
  return fetchManagementData(
    `/api/v1/management/refunds/${encodeURIComponent(refundId)}/item-received`,
    refundSchema,
    { method: "POST", json: input },
  );
}
