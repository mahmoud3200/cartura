import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import type { AnalyticsDateRange } from "./analytics.utils.js";

const paidPaymentStatuses = ["paid", "partially_refunded", "refunded"];
const paymentIssueStatuses = ["failed", "manual_review"];
const refundActionStatuses = [
  "requested",
  "approved",
  "pickup_scheduled",
  "item_received",
  "failed",
];

const recentOrderSelect = {
  id: true,
  orderNumber: true,
  status: true,
  totalAmount: true,
  currency: true,
  createdAt: true,
  user: {
    select: {
      name: true,
      email: true,
    },
  },
} satisfies Prisma.OrderSelect;

const recentUserSelect = {
  id: true,
  name: true,
  firstName: true,
  lastName: true,
  email: true,
  accountStatus: true,
} satisfies Prisma.UserSelect;

const recentRefundSelect = {
  id: true,
  amount: true,
  currency: true,
  status: true,
  reasonCode: true,
  payment: {
    select: {
      order: {
        select: {
          orderNumber: true,
          user: { select: { name: true } },
        },
      },
    },
  },
} satisfies Prisma.RefundSelect;

const recentPaymentWebhookEventSelect = {
  id: true,
  provider: true,
  providerEventId: true,
  eventType: true,
  status: true,
  failureReason: true,
  receivedAt: true,
} satisfies Prisma.PaymentWebhookEventSelect;

export class AnalyticsRepository {
  async getRangeOverview(range: AnalyticsDateRange) {
    const [
      orders,
      paidOrders,
      users,
      refunds,
      ordersByStatus,
      refundsByStatus,
      paymentWebhooksByStatus,
      grossRevenue,
      refundedRevenue,
    ] = await Promise.all([
      prisma.order.count({
        where: { createdAt: dateRangeWhere(range.from, range.to) },
      }),
      prisma.payment.count({
        where: {
          paidAt: dateRangeWhere(range.from, range.to),
          status: { in: paidPaymentStatuses },
        },
      }),
      prisma.user.count({
        where: { createdAt: dateRangeWhere(range.from, range.to) },
      }),
      prisma.refund.count({
        where: { createdAt: dateRangeWhere(range.from, range.to) },
      }),
      prisma.order.groupBy({
        by: ["status"],
        where: { createdAt: dateRangeWhere(range.from, range.to) },
        _count: { _all: true },
        orderBy: { status: "asc" },
      }),
      prisma.refund.groupBy({
        by: ["status"],
        where: { createdAt: dateRangeWhere(range.from, range.to) },
        _count: { _all: true },
        orderBy: { status: "asc" },
      }),
      prisma.paymentWebhookEvent.groupBy({
        by: ["status"],
        where: { receivedAt: dateRangeWhere(range.from, range.to) },
        _count: { _all: true },
        orderBy: { status: "asc" },
      }),
      prisma.payment.groupBy({
        by: ["currency"],
        where: {
          paidAt: dateRangeWhere(range.from, range.to),
          status: { in: paidPaymentStatuses },
        },
        _count: { _all: true },
        _sum: { amount: true },
        orderBy: { currency: "asc" },
      }),
      prisma.refund.groupBy({
        by: ["currency"],
        where: {
          completedAt: dateRangeWhere(range.from, range.to),
          status: "completed",
        },
        _sum: { amount: true },
        orderBy: { currency: "asc" },
      }),
    ]);

    return {
      orders,
      paidOrders,
      users,
      refunds,
      ordersByStatus,
      refundsByStatus,
      paymentWebhooksByStatus,
      grossRevenue: grossRevenue.map((row) => ({
        currency: row.currency,
        paidOrders: row._count._all,
        amount: decimalToNumber(row._sum.amount),
      })),
      refundedRevenue: refundedRevenue.map((row) => ({
        currency: row.currency,
        amount: decimalToNumber(row._sum.amount),
      })),
    };
  }

  async getOperationalOverview() {
    const [
      refundsNeedingAction,
      paymentIssues,
      recentOrders,
      recentUsers,
      recentRefunds,
      recentPaymentWebhookEvents,
    ] = await Promise.all([
      prisma.refund.count({
        where: {
          status: { in: refundActionStatuses },
        },
      }),
      prisma.paymentWebhookEvent.count({
        where: {
          status: { in: paymentIssueStatuses },
        },
      }),
      prisma.order.findMany({
        select: recentOrderSelect,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 6,
      }),
      prisma.user.findMany({
        select: recentUserSelect,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 6,
      }),
      prisma.refund.findMany({
        select: recentRefundSelect,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 6,
      }),
      prisma.paymentWebhookEvent.findMany({
        select: recentPaymentWebhookEventSelect,
        orderBy: [{ receivedAt: "desc" }, { id: "desc" }],
        take: 6,
      }),
    ]);

    return {
      refundsNeedingAction,
      paymentIssues,
      recentOrders: recentOrders.map((order) => ({
        ...order,
        totalAmount: decimalToNumber(order.totalAmount),
      })),
      recentUsers,
      recentRefunds: recentRefunds.map((refund) => ({
        ...refund,
        amount: decimalToNumber(refund.amount),
      })),
      recentPaymentWebhookEvents,
    };
  }
}

export type AnalyticsRangeData = Awaited<
  ReturnType<AnalyticsRepository["getRangeOverview"]>
>;

export type AnalyticsOperationalData = Awaited<
  ReturnType<AnalyticsRepository["getOperationalOverview"]>
>;

export const analyticsRepository = new AnalyticsRepository();

function dateRangeWhere(from: Date | null, to: Date) {
  return {
    ...(from ? { gte: from } : {}),
    lte: to,
  };
}

function decimalToNumber(value: Prisma.Decimal | null) {
  return value ? Number(value) : 0;
}
