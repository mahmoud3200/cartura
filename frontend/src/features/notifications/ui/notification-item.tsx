import type { Notification } from "@cartura/contracts/notifications";
import Link from "next/link";

import { cn } from "@/shared/lib/utils";
import {
  formatNotificationTime,
  getNotificationDisplay,
} from "../lib/notification-display";

export function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (notificationId: string) => void;
}) {
  const display = getNotificationDisplay(notification);
  const Icon = display.icon;
  const content = (
    <>
      <span
        className={cn(
          "mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg",
          notification.readAt
            ? "bg-muted text-muted-foreground"
            : "bg-primary/10 text-primary",
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span className="truncate text-sm font-medium">
            {notification.title}
          </span>
          {!notification.readAt ? (
            <span
              className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
              aria-label="Unread"
            />
          ) : null}
        </span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
          {notification.body}
        </span>
        <span className="mt-1.5 block text-[11px] text-muted-foreground">
          {formatNotificationTime(notification.createdAt)}
        </span>
      </span>
    </>
  );
  const className = cn(
    "flex w-full gap-3 rounded-lg px-3 py-3 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
    !notification.readAt && "bg-primary/[0.04]",
  );

  if (display.href) {
    return (
      <Link
        href={display.href}
        className={className}
        onClick={() => {
          if (!notification.readAt) {
            onRead(notification.id);
          }
        }}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (!notification.readAt) {
          onRead(notification.id);
        }
      }}
    >
      {content}
    </button>
  );
}
