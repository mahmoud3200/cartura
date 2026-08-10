import type {
  AnalyticsOverviewResponse,
  AnalyticsRevenue,
  AnalyticsStatusCount,
} from "@cartura/contracts/analytics";

import type { AnalyticsOperationalData } from "./analytics.repository.js";

export interface AnalyticsRangeSnapshot {
  generatedAt: string;
  range: AnalyticsOverviewResponse["range"];
  totals: Pick<
    AnalyticsOverviewResponse["totals"],
    "orders" | "paidOrders" | "users" | "refunds"
  >;
  revenue: AnalyticsRevenue[];
  ordersByStatus: AnalyticsStatusCount[];
  refundsByStatus: AnalyticsStatusCount[];
  paymentWebhooksByStatus: AnalyticsStatusCount[];
}

export interface AnalyticsOverviewData {
  rangeSnapshot: AnalyticsRangeSnapshot;
  operational: AnalyticsOperationalData;
}
