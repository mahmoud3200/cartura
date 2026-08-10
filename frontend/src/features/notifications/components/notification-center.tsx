"use client";

import { useState } from "react";

import { Popover } from "@/shared/ui/popover";
import { useNotificationFeed } from "../hooks/use-notification-feed";
import { NotificationPanel } from "../ui/notification-panel";
import { NotificationTrigger } from "../ui/notification-trigger";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const feed = useNotificationFeed();

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (nextOpen) {
          void feed.refetch();
        }
      }}
    >
      <NotificationTrigger unreadCount={feed.unreadCount} />
      <NotificationPanel
        items={feed.items}
        unreadCount={feed.unreadCount}
        isLoading={feed.isLoading}
        isError={feed.isError}
        isLoadingMore={feed.isFetchingNextPage}
        hasNextPage={feed.hasNextPage}
        isMarkingAllRead={feed.isMarkingAllRead}
        loadMoreRef={feed.setLoadMoreElement}
        onRead={feed.markRead}
        onMarkAllRead={feed.markAllRead}
      />
    </Popover>
  );
}
