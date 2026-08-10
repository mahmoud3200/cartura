import type { Notification } from "@cartura/contracts/notifications";
import type { RefCallback } from "react";

import { Skeleton } from "@/shared/ui/skeleton";
import { NotificationItem } from "./notification-item";

export function NotificationList({
  items,
  isLoading,
  isError,
  isLoadingMore,
  hasNextPage,
  loadMoreRef,
  onRead,
}: {
  items: Notification[];
  isLoading: boolean;
  isError: boolean;
  isLoadingMore: boolean;
  hasNextPage: boolean;
  loadMoreRef: RefCallback<HTMLDivElement>;
  onRead: (notificationId: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-3" aria-label="Loading notifications">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="px-5 py-10 text-center text-sm text-muted-foreground">
        Notifications could not be loaded. Close the panel and try again.
      </p>
    );
  }

  if (!items.length) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="text-sm font-medium">You are all caught up</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Order and payment updates will appear here.
        </p>
      </div>
    );
  }

  return (
    <div
      className="max-h-[min(30rem,70vh)] overflow-y-auto p-1.5"
      aria-live="polite"
    >
      {items.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRead={onRead}
        />
      ))}
      {hasNextPage ? (
        <div ref={loadMoreRef} className="p-2">
          {isLoadingMore ? (
            <Skeleton className="h-16 w-full rounded-lg" />
          ) : (
            <span className="sr-only">More notifications load on scroll</span>
          )}
        </div>
      ) : null}
    </div>
  );
}
