import { markAllNotificationsRead } from "@/features/notifications/api/notifications-server-api";
import { notificationRouteResponse } from "@/features/notifications/api/notification-route-response";
import { withBffRateLimitResponse } from "@/shared/rate-limit";

export function PATCH() {
  return withBffRateLimitResponse("mutation", () =>
    notificationRouteResponse(markAllNotificationsRead),
  );
}
