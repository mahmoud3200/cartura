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
            OR: [
              { claimedAt: null },
              { claimedAt: { lte: staleBefore } },
            ],
          },
        ],
      },
      include: pendingDeliveryInclude,
      orderBy: { createdAt: "asc" },
      take: limit,
    });
  }

  async claim(input: {
    deliveryId: string;
    availableAt: Date;
    staleBefore: Date;
    claimToken: string;
  }): Promise<boolean> {
    const claimed = await prisma.notificationDelivery.updateMany({
      where: {
        id: input.deliveryId,
        OR: [
          {
            status: "pending",
            OR: [
              { scheduledAt: null },
              { scheduledAt: { lte: input.availableAt } },
            ],
          },
          {
            status: "processing",
            OR: [
              { claimedAt: null },
              { claimedAt: { lte: input.staleBefore } },
            ],
          },
        ],
      },
      data: {
        status: "processing",
        attempts: { increment: 1 },
        claimToken: input.claimToken,
        claimedAt: input.availableAt,
      },
    });

    return claimed.count === 1;
  }

  async markSent(
    deliveryId: string,
    claimToken: string,
    providerMessageId: string | null,
    sentAt: Date,
  ) {
    const updated = await prisma.notificationDelivery.updateMany({
      where: { id: deliveryId, status: "processing", claimToken },
      data: {
        status: "sent",
        providerMessageId,
        failureReason: null,
        sentAt,
        claimToken: null,
        claimedAt: null,
      },
    });

    return updated.count === 1;
  }

  async recordFailure(
    deliveryId: string,
    claimToken: string,
    status: NotificationDeliveryFailureStatus,
    scheduledAt: Date,
    failureReason: string,
  ) {
    const updated = await prisma.notificationDelivery.updateMany({
      where: { id: deliveryId, status: "processing", claimToken },
      data: {
        status,
        scheduledAt,
        failureReason,
        claimToken: null,
        claimedAt: null,
      },
    });

    return updated.count === 1;
  }
}

export const notificationDeliveriesRepository =
  new NotificationDeliveriesRepository();
