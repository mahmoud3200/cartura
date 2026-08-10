import type { Notification } from "@cartura/contracts/notifications";
import { describe, expect, it, vi } from "vitest";

import {
  formatNotificationTime,
  getNotificationDisplay,
} from "./notification-display";

const notification: Notification = {
  id: "018f3f72-6ec8-7c39-a922-8794db2f8f00",
  userId: "018f3f72-6ec8-7c39-a922-8794db2f8f01",
  type: "order.placed",
  title: "Order placed",
  body: "Order CT-1042 was placed.",
  data: {
    orderId: "018f3f72-6ec8-7c39-a922-8794db2f8f02",
  },
  readAt: null,
  createdAt: "2026-07-28T10:00:00.000Z",
  deliveries: [],
};

describe("notification display", () => {
  it("links order notifications to the customer order detail", () => {
    expect(getNotificationDisplay(notification).href).toBe(
      "/settings/orders/018f3f72-6ec8-7c39-a922-8794db2f8f02",
    );
  });

  it("formats recent timestamps as relative time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-28T10:05:00.000Z"));

    expect(formatNotificationTime(notification.createdAt)).toBe(
      "5 minutes ago",
    );

    vi.useRealTimers();
  });
});
