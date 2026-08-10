import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { refundInclude } from "../refunds/refunds.repository.js";
import {
  dateRangeWhere,
  type AnalyticsDateRange,
} from "./analytics.utils.js";

const paidPaymentStatuses = ["paid", "partially_refunded", "refunded"];
const paymentIssueStatuses = ["failed", "manual_review"];
const refundActionStatuses = [
  "requested",
  "approved",
  "pickup_scheduled",
  "item_received",
  "failed",
];

const recentOrderInclude = {
  user: {
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  address: true,
  items: true,
  payment: true,
  statusHistory: { orderBy: { createdAt: "asc" } },
} satisfies Prisma.OrderInclude;

const recentUserInclude = {
  assignedRole: {
    include: {
      role: true,
    },
  },
} satisfies Prisma.UserInclude;

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
      grossRevenue,
      refundedRevenue,
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
        include: recentOrderInclude,
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.user.findMany({
        include: recentUserInclude,
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.refund.findMany({
        include: refundInclude,
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.paymentWebhookEvent.findMany({
        orderBy: { receivedAt: "desc" },
        take: 6,
      }),
    ]);

    return {
      refundsNeedingAction,
      paymentIssues,
      recentOrders,
      recentUsers,
      recentRefunds,
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
