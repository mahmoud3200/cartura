import type { ListNotificationsQuery } from "@cartura/contracts/notifications";

import { notificationNotFoundError } from "./notifications.errors.js";
import {
  notificationsRepository,
  type NotificationsRepository,
} from "./notifications.repository.js";
import type { CreateNotificationInput } from "./notifications.types.js";

export class NotificationsService {
  constructor(
    private readonly repository: NotificationsRepository =
      notificationsRepository,
  ) {}

  list(userId: string, query: ListNotificationsQuery) {
    return this.repository.list(userId, query);
  }

  create(input: CreateNotificationInput) {
    return this.repository.create(input);
  }

  async markRead(userId: string, notificationId: string) {
    const notification = await this.repository.findByIdForUser(
      userId,
      notificationId,
    );

    if (!notification) {
      throw notificationNotFoundError();
    }

    return this.repository.markRead(
      notificationId,
      notification.readAt ?? new Date(),
    );
  }

  async markAllRead(userId: string) {
    const result = await this.repository.markAllRead(userId, new Date());

    return { updatedCount: result.count };
  }

}

export const notificationsService = new NotificationsService();
