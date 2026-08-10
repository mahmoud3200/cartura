import { z } from "zod";

import {
  dataResponseSchema,
  paginatedResponseSchema,
  paginationQuerySchema,
} from "../common/index.js";

export const listNotificationsQuerySchema = z.intersection(
  paginationQuerySchema,
  z.object({
    unreadOnly: z.coerce.boolean().optional(),
  }),
);

export const notificationIdParamsSchema = z.object({
  notificationId: z.uuid(),
});

export const notificationDeliverySchema = z.object({
  id: z.uuid(),
  channel: z.string(),
  recipient: z.string(),
  status: z.string(),
  attempts: z.number().int().nonnegative(),
  providerMessageId: z.string().nullable(),
  failureReason: z.string().nullable(),
  scheduledAt: z.string().nullable(),
  sentAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const notificationSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  type: z.string(),
  title: z.string(),
  body: z.string(),
  data: z.json().nullable(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
  deliveries: z.array(notificationDeliverySchema),
});

export const notificationResponseSchema = dataResponseSchema(notificationSchema);
export const notificationListResponseSchema = paginatedResponseSchema(
  notificationSchema,
).extend({
  unreadCount: z.number().int().nonnegative(),
});
export const markAllNotificationsReadResponseSchema = dataResponseSchema(
  z.object({
    updatedCount: z.number().int().nonnegative(),
  }),
);

export type ListNotificationsQuery = z.infer<
  typeof listNotificationsQuerySchema
>;
export type NotificationIdParams = z.infer<
  typeof notificationIdParamsSchema
>;
export type NotificationDelivery = z.infer<
  typeof notificationDeliverySchema
>;
export type Notification = z.infer<typeof notificationSchema>;
export type NotificationResponse = z.infer<
  typeof notificationResponseSchema
>;
export type NotificationListResponse = z.infer<
  typeof notificationListResponseSchema
>;
export type MarkAllNotificationsReadResponse = z.infer<
  typeof markAllNotificationsReadResponseSchema
>;
