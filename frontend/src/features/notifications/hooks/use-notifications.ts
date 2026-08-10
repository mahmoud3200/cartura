"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
import type {
  Notification,
  NotificationListResponse,
} from "@cartura/contracts/notifications";
import { toast } from "sonner";

import {
  fetchNotificationsPage,
  markAllNotificationsReadRequest,
  markNotificationReadRequest,
} from "../api/notifications-api";

const notificationsQueryKey = ["notifications", "feed"] as const;

export function useInfiniteNotifications(limit = 12) {
  return useInfiniteQuery({
    queryKey: [...notificationsQueryKey, limit],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchNotificationsPage({ page: pageParam, limit }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage
        ? lastPage.pagination.page + 1
        : undefined,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead(limit = 12) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationReadRequest,
    onSuccess: ({ data }) => {
      markNotificationInFeedAsRead(queryClient, limit, data);
    },
    onError: () => {
      toast.error("Notification could not be marked as read.");
    },
  });
}

export function useMarkAllNotificationsRead(limit = 12) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsReadRequest,
    onSuccess: () => {
      const readAt = new Date().toISOString();

      updateNotificationFeed(queryClient, limit, (page) => ({
        ...page,
        unreadCount: 0,
        data: page.data.map<Notification>((notification) => ({
          ...notification,
          readAt: notification.readAt ?? readAt,
        })),
      }));
    },
    onError: () => {
      toast.error("Notifications could not be marked as read.");
    },
  });
}

function markNotificationInFeedAsRead(
  queryClient: QueryClient,
  limit: number,
  updatedNotification: Notification,
) {
  queryClient.setQueryData<
    InfiniteData<NotificationListResponse, number>
  >([...notificationsQueryKey, limit], (current) => {
    if (!current) {
      return current;
    }

    const wasUnread = current.pages.some((page) =>
      page.data.some(
        (notification) =>
          notification.id === updatedNotification.id &&
          notification.readAt === null,
      ),
    );

    return {
      ...current,
      pages: current.pages.map((page) => ({
        ...page,
        unreadCount: wasUnread
          ? Math.max(0, page.unreadCount - 1)
          : page.unreadCount,
        data: page.data.map((notification) =>
          notification.id === updatedNotification.id
            ? updatedNotification
            : notification,
        ),
      })),
    };
  });
}

function updateNotificationFeed(
  queryClient: QueryClient,
  limit: number,
  updatePage: (page: NotificationListResponse) => NotificationListResponse,
) {
  queryClient.setQueryData<
    InfiniteData<NotificationListResponse, number>
  >([...notificationsQueryKey, limit], (current) => {
    if (!current) {
      return current;
    }

    return {
      ...current,
      pages: current.pages.map(updatePage),
    };
  });
}
