import assert from "node:assert/strict";
import test from "node:test";

import {
  dateRangeWhere,
  getAnalyticsDateRange,
} from "./analytics.utils.js";

test("analytics presets use exact rolling durations", () => {
  const now = new Date("2026-08-09T18:00:00.000Z");

  assert.equal(
    getAnalyticsDateRange("7d", now).from?.toISOString(),
    "2026-08-02T18:00:00.000Z",
  );
  assert.equal(
    getAnalyticsDateRange("30d", now).from?.toISOString(),
    "2026-07-10T18:00:00.000Z",
  );
  assert.equal(
    getAnalyticsDateRange("90d", now).from?.toISOString(),
    "2026-05-11T18:00:00.000Z",
  );
});

test("all-time analytics have no lower date bound", () => {
  const now = new Date("2026-08-09T18:00:00.000Z");
  const range = getAnalyticsDateRange("all", now);

  assert.equal(range.from, null);
  assert.deepEqual(dateRangeWhere(range.from, range.to), { lte: now });
});
