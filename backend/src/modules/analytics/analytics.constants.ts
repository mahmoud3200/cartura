import type { AnalyticsRangePreset } from "@cartura/contracts/analytics";

const HOUR_IN_MILLISECONDS = 60 * 60 * 1_000;

export const ANALYTICS_RANGE_DURATION_MS = {
  "7d": 168 * HOUR_IN_MILLISECONDS,
  "30d": 30 * 24 * HOUR_IN_MILLISECONDS,
  "90d": 90 * 24 * HOUR_IN_MILLISECONDS,
  all: null,
} satisfies Record<AnalyticsRangePreset, number | null>;

export const ANALYTICS_RANGE_CACHE_TTL_SECONDS = {
  "7d": 5 * 60,
  "30d": 10 * 60,
  "90d": 15 * 60,
  all: 30 * 60,
} satisfies Record<AnalyticsRangePreset, number>;

export function getAnalyticsRangeCacheKey(preset: AnalyticsRangePreset) {
  return `analytics:overview-range:v1:${preset}`;
}
