import type { AnalyticsStatusCount } from "@cartura/contracts/analytics";

export type StatusTone = "success" | "pending" | "attention" | "neutral";

export type StatusSegment = {
  status: string;
  count: number;
  share: number;
  tone: StatusTone;
};

export type OrderStatusSummary = {
  total: number;
  paid: number;
  attention: number;
};

export type RefundStatusSummary = {
  total: number;
  needingAction: number;
  completed: number;
};

export type WebhookStatusSummary = {
  total: number;
  processed: number;
  issues: number;
  successRate: number;
};

const SUCCESS_STATUSES = new Set([
  "paid",
  "completed",
  "processed",
  "shipped",
]);

const ATTENTION_STATUSES = new Set([
  "failed",
  "payment_failed",
  "manual_review",
  "cancelled",
  "rejected",
]);

const PENDING_STATUSES = new Set([
  "pending",
  "confirmed",
  "processing",
  "received",
  "requested",
  "approved",
  "pickup_scheduled",
  "item_received",
  "partially_refunded",
]);

export function getStatusTone(status: string): StatusTone {
  if (SUCCESS_STATUSES.has(status)) return "success";
  if (ATTENTION_STATUSES.has(status)) return "attention";
  if (PENDING_STATUSES.has(status)) return "pending";
  return "neutral";
}

export function getToneFillClass(tone: StatusTone) {
  switch (tone) {
    case "success":
      return "bg-accent";
    case "pending":
      return "bg-chart-3";
    case "attention":
      return "bg-destructive";
    case "neutral":
      return "bg-foreground/25";
  }
}

export function getStatusSegments(
  items: readonly AnalyticsStatusCount[],
): StatusSegment[] {
  const total = getStatusTotal(items);
  if (total === 0) return [];

  return items
    .filter((item) => item.count > 0)
    .map((item) => ({
      status: item.status,
      count: item.count,
      share: (item.count / total) * 100,
      tone: getStatusTone(item.status),
    }))
    .sort((left, right) => right.count - left.count);
}

export function summarizeOrderStatuses(
  items: readonly AnalyticsStatusCount[],
): OrderStatusSummary {
  return {
    total: getStatusTotal(items),
    paid: getStatusCount(items, ["paid"]),
    attention: getStatusCount(items, ["payment_failed", "cancelled"]),
  };
}

export function summarizeRefundStatuses(
  items: readonly AnalyticsStatusCount[],
  needingAction: number,
): RefundStatusSummary {
  return {
    total: getStatusTotal(items),
    needingAction,
    completed: getStatusCount(items, ["completed"]),
  };
}

export function summarizeWebhookStatuses(
  items: readonly AnalyticsStatusCount[],
): WebhookStatusSummary {
  const total = getStatusTotal(items);
  const processed = getStatusCount(items, ["processed"]);

  return {
    total,
    processed,
    issues: getStatusCount(items, ["failed", "manual_review"]),
    successRate: total === 0 ? 0 : Math.round((processed / total) * 100),
  };
}

function getStatusTotal(items: readonly AnalyticsStatusCount[]) {
  return items.reduce((total, item) => total + item.count, 0);
}

function getStatusCount(
  items: readonly AnalyticsStatusCount[],
  statuses: readonly string[],
) {
  return items
    .filter((item) => statuses.includes(item.status))
    .reduce((total, item) => total + item.count, 0);
}
