import type { ListNotificationsQuery } from "@cartura/contracts/notifications";

import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { createPaginatedResult } from "../../shared/pagination/pagination.js";
import type { CreateNotificationInput } from "./notifications.types.js";

const notificationInclude = {
  deliveries: {
    orderBy: { createdAt: "asc" },
  },
} satisfies Prisma.NotificationInclude;

export type NotificationWithDeliveries = Prisma.NotificationGetPayload<{
  include: typeof notificationInclude;
}>;

export class NotificationsRepository {
  async list(userId: string, query: ListNotificationsQuery) {
    const where: Prisma.NotificationWhereInput = query.unreadOnly
      ? { userId, readAt: null }
      : { userId };
    const [items, totalItems, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: notificationInclude,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    return {
      ...createPaginatedResult(items, totalItems, query),
      unreadCount,
    };
  }

  create(input: CreateNotificationInput) {
    const data: Prisma.NotificationCreateInput = {
      user: {
        connect: { id: input.userId },
      },
      type: input.type,
      title: input.title,
      body: input.body,
    };

    if (input.data) {
      data.data = input.data as Prisma.InputJsonValue;
    }

    if (input.emailRecipient) {
      data.deliveries = {
        create: {
          channel: "email",
          recipient: input.emailRecipient,
          status: "pending",
        },
      };
    }

    if (!input.sourceEventId) {
      return prisma.notification.create({
        data,
        include: notificationInclude,
      });
    }

    return prisma.notification.upsert({
      where: { sourceEventId: input.sourceEventId },
      create: {
        ...data,
        sourceEventId: input.sourceEventId,
      },
      update: {},
      include: notificationInclude,
    });
  }

  findByIdForUser(userId: string, notificationId: string) {
    return prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
  }

  markRead(notificationId: string, readAt: Date) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { readAt },
      include: notificationInclude,
    });
  }

  markAllRead(userId: string, readAt: Date) {
    return prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt },
    });
  }

}

export const notificationsRepository = new NotificationsRepository();
