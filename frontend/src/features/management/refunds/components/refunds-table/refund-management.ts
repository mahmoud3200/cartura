import type { ManagementRefund } from "@cartura/contracts/refunds";

export type RefundManagementAction = "review" | "receive" | "issue";

export function getRefundManagementActions(
  refund: Pick<ManagementRefund, "status">,
): RefundManagementAction[] {
  switch (refund.status) {
    case "requested":
      return ["review"];
    case "pickup_scheduled":
      return ["receive"];
    case "approved":
    case "item_received":
    case "failed":
      return ["issue"];
    default:
      return [];
  }
}

export function getRefundExecutionFeedback(
  refund: Pick<ManagementRefund, "status" | "failureReason">,
) {
  if (refund.status === "completed") {
    return { kind: "success" as const, title: "Refund completed" };
  }

  if (refund.status === "processing" && !refund.failureReason) {
    return { kind: "success" as const, title: "Refund is processing" };
  }

  if (refund.status === "processing") {
    return {
      kind: "error" as const,
      title: "Refund needs manual review",
      description: refund.failureReason,
    };
  }

  return {
    kind: "error" as const,
    title: "Refund was not completed",
    description:
      refund.failureReason ?? "Review the current refund state before retrying.",
  };
}

