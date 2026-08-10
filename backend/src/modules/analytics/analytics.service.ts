import type {
  AnalyticsOverviewQuery,
} from "@cartura/contracts/analytics";

import {
  cacheService,
  type CacheService,
} from "../../infrastructure/cache/index.js";
import {
  ANALYTICS_RANGE_CACHE_TTL_SECONDS,
  getAnalyticsRangeCacheKey,
} from "./analytics.constants.js";
import {
  analyticsRepository,
  type AnalyticsRepository,
} from "./analytics.repository.js";
import { createAnalyticsRangeSnapshot } from "./analytics.snapshot.js";
import type { AnalyticsRangeSnapshot } from "./analytics.types.js";
import { getAnalyticsDateRange } from "./analytics.utils.js";

export class AnalyticsService {
  constructor(
    private readonly repository: AnalyticsRepository = analyticsRepository,
    private readonly cache: CacheService = cacheService,
  ) {}

  async getOverview(query: AnalyticsOverviewQuery) {
    const range = getAnalyticsDateRange(query.range);
    const cacheKey = getAnalyticsRangeCacheKey(query.range);
    const cacheTtlSeconds = ANALYTICS_RANGE_CACHE_TTL_SECONDS[query.range];
    const [rangeSnapshot, operational] = await Promise.all([
      this.cache.remember<AnalyticsRangeSnapshot>(
        cacheKey,
        async () => {
          const data = await this.repository.getRangeOverview(range);
          return createAnalyticsRangeSnapshot(data, range);
        },
        cacheTtlSeconds,
      ),
      this.repository.getOperationalOverview(),
    ]);

    return { rangeSnapshot, operational };
  }
}

export const analyticsService = new AnalyticsService();
