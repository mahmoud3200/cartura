import type { NextRequest } from "next/server";

import { listNotifications } from "@/features/notifications/api/notifications-server-api";
import { notificationRouteResponse } from "@/features/notifications/api/notification-route-response";

export function GET(request: NextRequest) {
  return notificationRouteResponse(() =>
    listNotifications({
      page: request.nextUrl.searchParams.get("page") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
      unreadOnly:
        request.nextUrl.searchParams.get("unreadOnly") ?? undefined,
    }),
  );
}
