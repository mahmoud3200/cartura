import { ORDER_STATUSES } from "@cartura/contracts/orders";
import { PAYMENT_WEBHOOK_EVENT_STATUSES } from "@cartura/contracts/payments";
import { REFUND_STATUSES } from "@cartura/contracts/refunds";

import type { AnalyticsRangeData } from "./analytics.repository.js";
import type { AnalyticsRangeSnapshot } from "./analytics.types.js";
import {
  roundMoney,
  type AnalyticsDateRange,
} from "./analytics.utils.js";

export function createAnalyticsRangeSnapshot(
  data: AnalyticsRangeData,
  range: AnalyticsDateRange,
): AnalyticsRangeSnapshot {
  return {
    generatedAt: range.to.toISOString(),
    range: {
      preset: range.preset,
      from: range.from?.toISOString() ?? null,
      to: range.to.toISOString(),
    },
    totals: {
      orders: data.orders,
      paidOrders: data.paidOrders,
      users: data.users,
      refunds: data.refunds,
    },
    revenue: buildRevenue(data.grossRevenue, data.refundedRevenue),
    ordersByStatus: mapStatusCounts(data.ordersByStatus, ORDER_STATUSES),
    refundsByStatus: mapStatusCounts(data.refundsByStatus, REFUND_STATUSES),
    paymentWebhooksByStatus: mapStatusCounts(
      data.paymentWebhooksByStatus,
      PAYMENT_WEBHOOK_EVENT_STATUSES,
    ),
  };
}

function mapStatusCounts(
  rows: Array<{ status: string; _count: { _all: number } }>,
  expectedStatuses: readonly string[],
) {
  const counts = new Map(
    rows.map(({ status, _count }) => [status, _count._all]),
  );

  return expectedStatuses.map((status) => ({
    status,
    count: counts.get(status) ?? 0,
  }));
}

function buildRevenue(
  grossRows: AnalyticsRangeData["grossRevenue"],
  refundRows: AnalyticsRangeData["refundedRevenue"],
) {
  const byCurrency = new Map<
    string,
    { currency: string; gross: number; refunded: number; paidOrders: number }
  >();

  for (const row of grossRows) {
    byCurrency.set(row.currency, {
      currency: row.currency,
      gross: row.amount,
      refunded: 0,
      paidOrders: row.paidOrders,
    });
  }

  for (const row of refundRows) {
    const current = byCurrency.get(row.currency) ?? {
      currency: row.currency,
      gross: 0,
      refunded: 0,
      paidOrders: 0,
    };

    current.refunded = row.amount;
    byCurrency.set(row.currency, current);
  }

  return Array.from(byCurrency.values())
    .map((item) => ({
      ...item,
      net: roundMoney(item.gross - item.refunded),
    }))
    .sort((left, right) => left.currency.localeCompare(right.currency));
}
