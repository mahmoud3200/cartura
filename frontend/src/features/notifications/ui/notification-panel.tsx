import type { Notification } from "@cartura/contracts/notifications";
import type { RefCallback } from "react";

import {
  PopoverContent,
  PopoverPortal,
  PopoverPositioner,
} from "@/shared/ui/popover";
import { NotificationList } from "./notification-list";

export function NotificationPanel({
  items,
  unreadCount,
  isLoading,
  isError,
  isLoadingMore,
  hasNextPage,
  isMarkingAllRead,
  loadMoreRef,
  onRead,
  onMarkAllRead,
}: {
  items: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isError: boolean;
  isLoadingMore: boolean;
  hasNextPage: boolean;
  isMarkingAllRead: boolean;
  loadMoreRef: RefCallback<HTMLDivElement>;
  onRead: (notificationId: string) => void;
  onMarkAllRead: () => void;
}) {
  return (
    <PopoverPortal>
      <PopoverPositioner collisionPadding={12}>
        <PopoverContent className="w-[min(24rem,calc(100vw-1.5rem))]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">Notifications</h2>
              <p className="text-xs text-muted-foreground">
                {unreadCount
                  ? `${unreadCount} unread`
                  : "No unread notifications"}
              </p>
            </div>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-xs font-medium text-primary outline-none transition hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              disabled={unreadCount === 0 || isMarkingAllRead}
              onClick={onMarkAllRead}
            >
              Mark all read
            </button>
          </div>
          <NotificationList
            items={items}
            isLoading={isLoading}
            isError={isError}
            isLoadingMore={isLoadingMore}
            hasNextPage={hasNextPage}
            loadMoreRef={loadMoreRef}
            onRead={onRead}
          />
        </PopoverContent>
      </PopoverPositioner>
    </PopoverPortal>
  );
}
