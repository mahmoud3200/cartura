export type CreateNotificationInput = {
  sourceEventId?: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  emailRecipient?: string | null;
};

export type NotificationDeliveryFailureStatus = "failed" | "pending";
