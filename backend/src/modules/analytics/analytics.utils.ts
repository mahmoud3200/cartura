import type { AnalyticsRangePreset } from "@cartura/contracts/analytics";

import { ANALYTICS_RANGE_DURATION_MS } from "./analytics.constants.js";

export interface AnalyticsDateRange {
  preset: AnalyticsRangePreset;
  from: Date | null;
  to: Date;
}

export function getAnalyticsDateRange(
  preset: AnalyticsRangePreset,
  now = new Date(),
): AnalyticsDateRange {
  const to = new Date(now);
  const duration = ANALYTICS_RANGE_DURATION_MS[preset];
  const from = duration === null ? null : new Date(to.getTime() - duration);

  return { preset, from, to };
}

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
