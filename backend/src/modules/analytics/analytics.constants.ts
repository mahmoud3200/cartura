import type { AnalyticsRangePreset } from "@cartura/contracts/analytics";

const HOUR_IN_MILLISECONDS = 60 * 60 * 1_000;

export const ANALYTICS_RANGE_DURATION_MS = {
  "7d": 168 * HOUR_IN_MILLISECONDS,
  "30d": 30 * 24 * HOUR_IN_MILLISECONDS,
  "90d": 90 * 24 * HOUR_IN_MILLISECONDS,
  all: null,
} satisfies Record<AnalyticsRangePreset, number | null>;
