import { z } from "zod";

import {
  dataResponseSchema,
  paginatedQuerySchema,
  paginatedResponseSchema,
} from "../common/index.js";

const booleanQuerySchema = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean());

export const listNotificationsQuerySchema = paginatedQuerySchema({
  unreadOnly: booleanQuerySchema.optional(),
});

export const notificationIdParamsSchema = z.object({
  notificationId: z.uuid(),
}).strict();

export const notificationDeliverySchema = z.object({
  id: z.uuid(),
  channel: z.string(),
  status: z.string(),
  sentAt: z.iso.datetime().nullable(),
});

export const notificationSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  type: z.string(),
  title: z.string(),
  body: z.string(),
  data: z.json().nullable(),
  readAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
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
