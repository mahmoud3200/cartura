import type { NextRequest } from "next/server";

import { listNotifications } from "@/features/notifications/api/notifications-server-api";
import { notificationRouteResponse } from "@/features/notifications/api/notification-route-response";
import { withBffRateLimitResponse } from "@/shared/rate-limit";

export function GET(request: NextRequest) {
  return withBffRateLimitResponse("read", () =>
    notificationRouteResponse(() =>
      listNotifications({
        page: request.nextUrl.searchParams.get("page") ?? undefined,
        limit: request.nextUrl.searchParams.get("limit") ?? undefined,
        unreadOnly:
          request.nextUrl.searchParams.get("unreadOnly") ?? undefined,
      }),
    ),
  );
}
