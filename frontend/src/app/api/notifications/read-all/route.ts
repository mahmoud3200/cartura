import { markAllNotificationsRead } from "@/features/notifications/api/notifications-server-api";
import { notificationRouteResponse } from "@/features/notifications/api/notification-route-response";

export function PATCH() {
  return notificationRouteResponse(markAllNotificationsRead);
}
