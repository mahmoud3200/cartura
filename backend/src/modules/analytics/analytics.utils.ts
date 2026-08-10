import type { AnalyticsRangePreset } from "@cartura/contracts/analytics";

import type { Prisma } from "../../generated/prisma/client.js";
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

export function dateRangeWhere(from: Date | null, to: Date) {
  return {
    ...(from ? { gte: from } : {}),
    lte: to,
  };
}

export function decimalToNumber(value: Prisma.Decimal | null) {
  return value ? Number(value) : 0;
}

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
