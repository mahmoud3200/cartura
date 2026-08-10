import {
  analyticsOverviewResponseSchema,
  type AnalyticsOverviewQuery,
  type AnalyticsOverviewResponse,
} from "@cartura/contracts/analytics";

import { fetchManagementData } from "@/features/management/shared/api/management-api";

export async function getAnalyticsOverview(
  query: AnalyticsOverviewQuery = { range: "30d" },
): Promise<AnalyticsOverviewResponse> {
  const params = new URLSearchParams({ range: query.range });
  return fetchManagementData(
    `/api/v1/management/analytics/overview?${params.toString()}`,
    analyticsOverviewResponseSchema,
  );
}

import "server-only";
