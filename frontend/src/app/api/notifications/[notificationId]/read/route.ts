import { markNotificationRead } from "@/features/notifications/api/notifications-server-api";
import { notificationRouteResponse } from "@/features/notifications/api/notification-route-response";

export function PATCH(
  _request: Request,
  context: { params: Promise<{ notificationId: string }> },
) {
  return notificationRouteResponse(async () => {
    const { notificationId } = await context.params;

    return markNotificationRead(notificationId);
  });
}
