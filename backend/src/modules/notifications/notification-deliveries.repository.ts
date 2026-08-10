import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import type { NotificationDeliveryFailureStatus } from "./notifications.types.js";

const pendingDeliveryInclude = {
  notification: true,
} satisfies Prisma.NotificationDeliveryInclude;

export type PendingNotificationDelivery =
  Prisma.NotificationDeliveryGetPayload<{
    include: typeof pendingDeliveryInclude;
  }>;

export class NotificationDeliveriesRepository {
  findPending(limit: number, availableAt: Date, staleBefore: Date) {
    return prisma.notificationDelivery.findMany({
      where: {
        OR: [
          {
            status: "pending",
            OR: [
              { scheduledAt: null },
              { scheduledAt: { lte: availableAt } },
            ],
          },
          {
            status: "processing",
            updatedAt: { lte: staleBefore },
          },
        ],
      },
      include: pendingDeliveryInclude,
      orderBy: { createdAt: "asc" },
      take: limit,
    });
  }

  async claim(deliveryId: string, staleBefore: Date): Promise<boolean> {
    const claimed = await prisma.notificationDelivery.updateMany({
      where: {
        id: deliveryId,
        OR: [
          { status: "pending" },
          {
            status: "processing",
            updatedAt: { lte: staleBefore },
          },
        ],
      },
      data: {
        status: "processing",
        attempts: { increment: 1 },
      },
    });

    return claimed.count === 1;
  }

  markSent(
    deliveryId: string,
    providerMessageId: string | null,
    sentAt: Date,
  ) {
    return prisma.notificationDelivery.update({
      where: { id: deliveryId },
      data: {
        status: "sent",
        providerMessageId,
        failureReason: null,
        sentAt,
      },
    });
  }

  recordFailure(
    deliveryId: string,
    status: NotificationDeliveryFailureStatus,
    scheduledAt: Date,
    failureReason: string,
  ) {
    return prisma.notificationDelivery.update({
      where: { id: deliveryId },
      data: {
        status,
        scheduledAt,
        failureReason,
      },
    });
  }
}

export const notificationDeliveriesRepository =
  new NotificationDeliveriesRepository();
