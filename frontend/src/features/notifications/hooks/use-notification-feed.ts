"use client";

import { useEffect, useMemo, useState } from "react";

import {
  useInfiniteNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "./use-notifications";

const NOTIFICATION_PAGE_SIZE = 12;

export function useNotificationFeed() {
  const [loadMoreElement, setLoadMoreElement] =
    useState<HTMLDivElement | null>(null);
  const notifications = useInfiniteNotifications(NOTIFICATION_PAGE_SIZE);
  const markRead = useMarkNotificationRead(NOTIFICATION_PAGE_SIZE);
  const markAllRead = useMarkAllNotificationsRead(NOTIFICATION_PAGE_SIZE);
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = notifications;

  useEffect(() => {
    if (!loadMoreElement || !hasNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "120px" },
    );

    observer.observe(loadMoreElement);

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, loadMoreElement]);

  const items = useMemo(
    () => {
      const loaded =
        notifications.data?.pages.flatMap((page) => page.data) ?? [];

      return loaded.filter(
        (notification, index) =>
          loaded.findIndex((item) => item.id === notification.id) === index,
      );
    },
    [notifications.data],
  );

  return {
    items,
    unreadCount: notifications.data?.pages[0]?.unreadCount ?? 0,
    isLoading: notifications.isLoading,
    isError: notifications.isError,
    isFetchingNextPage,
    hasNextPage: Boolean(hasNextPage),
    setLoadMoreElement,
    refetch: notifications.refetch,
    markRead: (notificationId: string) => markRead.mutate(notificationId),
    markAllRead: () => markAllRead.mutate(),
    isMarkingAllRead: markAllRead.isPending,
  };
}
