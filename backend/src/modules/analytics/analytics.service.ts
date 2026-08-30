import type {
  AnalyticsOverviewQuery,
} from "@cartura/contracts/analytics";

import {
  analyticsRepository,
  type AnalyticsRepository,
} from "./analytics.repository.js";
import { createAnalyticsRangeSnapshot } from "./analytics.snapshot.js";
import { getAnalyticsDateRange } from "./analytics.utils.js";

export class AnalyticsService {
  constructor(
    private readonly repository: AnalyticsRepository = analyticsRepository,
  ) {}

  async getOverview(query: AnalyticsOverviewQuery) {
    const range = getAnalyticsDateRange(query.range);
    const [rangeData, operational] = await Promise.all([
      this.repository.getRangeOverview(range),
      this.repository.getOperationalOverview(),
    ]);
    const rangeSnapshot = createAnalyticsRangeSnapshot(rangeData, range);

    return { rangeSnapshot, operational };
  }
}

export const analyticsService = new AnalyticsService();
