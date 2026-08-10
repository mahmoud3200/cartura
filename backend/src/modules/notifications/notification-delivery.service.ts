import {
  mailService,
  type MailService,
} from "../../infrastructure/mail/index.js";
import {
  notificationDeliveriesRepository,
  type NotificationDeliveriesRepository,
} from "./notification-deliveries.repository.js";
import { createNotificationEmail } from "./notifications.email.js";
import {
  DELIVERY_CLAIM_TIMEOUT_MS,
  getDeliveryErrorMessage,
  MAX_DELIVERY_ATTEMPTS,
  nextDeliveryAttemptAt,
} from "./notifications.utils.js";

export class NotificationDeliveryService {
  constructor(
    private readonly repository: NotificationDeliveriesRepository =
      notificationDeliveriesRepository,
    private readonly mailer: MailService = mailService,
  ) {}

  async processPending(limit = 25): Promise<number> {
    const now = new Date();
    const staleBefore = new Date(
      now.getTime() - DELIVERY_CLAIM_TIMEOUT_MS,
    );
    const deliveries = await this.repository.findPending(
      limit,
      now,
      staleBefore,
    );
    let processed = 0;

    for (const delivery of deliveries) {
      const claimed = await this.repository.claim(delivery.id, staleBefore);

      if (!claimed) {
        continue;
      }

      try {
        if (delivery.channel !== "email") {
          throw new Error(`Unsupported delivery channel: ${delivery.channel}`);
        }

        const result = await this.mailer.sendMail({
          to: delivery.recipient,
          ...createNotificationEmail(delivery.notification),
        });

        await this.repository.markSent(
          delivery.id,
          result.messageId ?? null,
          new Date(),
        );
        processed += 1;
      } catch (error) {
        const attempts = delivery.attempts + 1;

        await this.repository.recordFailure(
          delivery.id,
          attempts >= MAX_DELIVERY_ATTEMPTS ? "failed" : "pending",
          nextDeliveryAttemptAt(attempts, new Date()),
          getDeliveryErrorMessage(error),
        );
      }
    }

    return processed;
  }
}

export const notificationDeliveryService =
  new NotificationDeliveryService();
