import type { Notification } from "@cartura/contracts/notifications";

import type { NotificationWithDeliveries } from "./notifications.repository.js";

export function mapNotification(
  notification: NotificationWithDeliveries,
): Notification {
  return {
    id: notification.id,
    userId: notification.userId,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    data: notification.data as Notification["data"],
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
    deliveries: notification.deliveries.map((delivery) => ({
      id: delivery.id,
      channel: delivery.channel,
      status: delivery.status,
      sentAt: delivery.sentAt?.toISOString() ?? null,
    })),
  };
}
