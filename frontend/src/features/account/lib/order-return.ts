import type { OrderSummary } from "@cartura/contracts/orders";
import {
  REFUND_WINDOW_DAYS,
  type Refund,
  type RefundReason,
} from "@cartura/contracts/refunds";

export const RETURN_REASON_OPTIONS = [
  { value: "damaged", label: "Arrived damaged" },
  { value: "defective", label: "Defective or not working" },
  { value: "wrong_item", label: "Wrong item delivered" },
  { value: "not_as_described", label: "Not as described" },
  { value: "changed_mind", label: "Changed my mind" },
  { value: "other", label: "Another reason" },
] as const satisfies ReadonlyArray<{ value: RefundReason; label: string }>;

type OrderReturnPanelState =
  | {
      kind: "request";
      deadline: Date;
      previousRejection?: Refund;
    }
  | { kind: "status"; refund: Refund }
  | { kind: "unavailable"; message: string };

const RETURN_WINDOW_MS = REFUND_WINDOW_DAYS * 24 * 60 * 60 * 1000;

export function getOrderReturnPanelState(
  order: Pick<OrderSummary, "status" | "completedAt">,
  refunds: Refund[],
  now = new Date(),
): OrderReturnPanelState {
  const latestRejectedRefund = refunds.find(
    (refund) => refund.status === "rejected",
  );
  const deadline = getReturnDeadline(
    order.completedAt,
    latestRejectedRefund?.reviewedAt ?? latestRejectedRefund?.updatedAt,
  );
  const activeRefund = refunds.find((refund) => refund.status !== "rejected");

  if (
    order.status === "completed" &&
    deadline &&
    deadline.getTime() >= now.getTime() &&
    !activeRefund
  ) {
    return {
      kind: "request",
      deadline,
      previousRejection: latestRejectedRefund,
    };
  }

  const visibleRefund = activeRefund ?? refunds[0];

  if (visibleRefund) {
    return { kind: "status", refund: visibleRefund };
  }

  return {
    kind: "unavailable",
    message:
      order.status === "completed"
        ? `The ${REFUND_WINDOW_DAYS}-day return window for this order has ended.`
        : "A return can be requested after delivery is completed.",
  };
}

export function getRefundReasonLabel(reason: Refund["reasonCode"]) {
  return (
    RETURN_REASON_OPTIONS.find((option) => option.value === reason)?.label ??
    "Other"
  );
}

function getReturnDeadline(
  completedAt: string | null | undefined,
  latestRejectedAt?: string | null,
) {
  const deadlines = [completedAt, latestRejectedAt]
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(new Date(value).getTime() + RETURN_WINDOW_MS));

  return deadlines.length
    ? new Date(Math.max(...deadlines.map((deadline) => deadline.getTime())))
    : null;
}
