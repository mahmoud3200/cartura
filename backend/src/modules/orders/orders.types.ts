export type { OrderWithDetails } from "./orders.repository.js";

export type OrderNotificationIntent = {
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
};

export type OrderNotificationRecipient = {
  orderId: string;
  userId: string;
  emailRecipient: string;
};
