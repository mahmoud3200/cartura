import "server-only";

import {
  listNotificationsQuerySchema,
  markAllNotificationsReadResponseSchema,
  notificationListResponseSchema,
  notificationResponseSchema,
} from "@cartura/contracts/notifications";

import { serverApiFetch } from "@/shared/api/server-api";

export async function listNotifications(
  input: unknown = {},
) {
  const query = listNotificationsQuerySchema.parse(input);
  const searchParams = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  });

  if (query.unreadOnly !== undefined) {
    searchParams.set("unreadOnly", String(query.unreadOnly));
  }

  const payload = await serverApiFetch<unknown>(
    `/api/v1/notifications?${searchParams.toString()}`,
  );

  return notificationListResponseSchema.parse(payload);
}

export async function markNotificationRead(notificationId: string) {
  const payload = await serverApiFetch<unknown>(
    `/api/v1/notifications/${encodeURIComponent(notificationId)}/read`,
    { method: "PATCH" },
  );

  return notificationResponseSchema.parse(payload);
}

export async function markAllNotificationsRead() {
  const payload = await serverApiFetch<unknown>(
    "/api/v1/notifications/read-all",
    { method: "PATCH" },
  );

  return markAllNotificationsReadResponseSchema.parse(payload);
}
