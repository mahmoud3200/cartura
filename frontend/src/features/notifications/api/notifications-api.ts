import {
  markAllNotificationsReadResponseSchema,
  notificationListResponseSchema,
  notificationResponseSchema,
} from "@cartura/contracts/notifications";
import { getRateLimitResponseMetadata } from "@/shared/api/rate-limit-headers";

export class NotificationApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "NotificationApiError";
  }
}

export async function fetchNotificationsPage(input: {
  page: number;
  limit: number;
}) {
  const searchParams = new URLSearchParams({
    page: String(input.page),
    limit: String(input.limit),
  });
  const response = await fetch(`/api/notifications?${searchParams.toString()}`);

  return parseResponse(response, notificationListResponseSchema);
}

export async function markNotificationReadRequest(notificationId: string) {
  const response = await fetch(
    `/api/notifications/${encodeURIComponent(notificationId)}/read`,
    { method: "PATCH" },
  );

  return parseResponse(response, notificationResponseSchema);
}

export async function markAllNotificationsReadRequest() {
  const response = await fetch("/api/notifications/read-all", {
    method: "PATCH",
  });

  return parseResponse(response, markAllNotificationsReadResponseSchema);
}

async function parseResponse<T>(
  response: Response,
  schema: { parse: (value: unknown) => T },
): Promise<T> {
  const payload: unknown = await response.json();

  if (!response.ok) {
    const metadata = getRateLimitResponseMetadata(response, payload);

    throw new NotificationApiError(
      getErrorMessage(payload),
      response.status,
      metadata.code,
      metadata.retryAfterSeconds,
    );
  }

  return schema.parse(payload);
}

function getErrorMessage(payload: unknown): string {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    payload.error &&
    typeof payload.error === "object" &&
    "message" in payload.error &&
    typeof payload.error.message === "string"
  ) {
    return payload.error.message;
  }

  return "Notifications could not be loaded.";
}
