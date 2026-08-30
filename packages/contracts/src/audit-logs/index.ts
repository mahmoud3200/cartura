import { z } from "zod";
import {
  paginatedQuerySchema,
  paginatedResponseSchema,
} from "../common/index.js";

export const AUDIT_ACTOR_TYPES = {
  USER: "user",
  SYSTEM: "system",
  PROVIDER: "provider",
} as const;

export const AUDIT_ACTIONS = {
  CATEGORY_CREATE: "category.create",
  CATEGORY_UPDATE: "category.update",
  CATEGORY_SOFT_DELETE: "category.soft_delete",
  PRODUCT_CREATE: "product.create",
  PRODUCT_UPDATE: "product.update",
  PRODUCT_INVENTORY_UPDATE: "product.inventory.update",
  PRODUCT_SOFT_DELETE: "product.soft_delete",
  USER_STATUS_UPDATE: "user.status.update",
  USER_ROLE_UPDATE: "user_role.update",
  ROLE_CREATE: "role.create",
  ROLE_UPDATE: "role.update",
  ROLE_PERMISSIONS_REPLACE: "role.permissions.replace",
  ROLE_DELETE: "role.delete",
  ORDER_STATUS_UPDATE: "order.status.update",
  ORDER_EXPIRED: "order.expired",
  PAYMENT_WEBHOOK_REPROCESS: "payment.webhook.reprocess",
  PAYMENT_WEBHOOK_MANUAL_REVIEW: "payment.webhook.manual_review",
  REFUND_REQUESTED: "refund.requested",
  REFUND_APPROVED: "refund.approved",
  REFUND_REJECTED: "refund.rejected",
  REFUND_PICKUP_SCHEDULED: "refund.pickup_scheduled",
  REFUND_ITEM_RECEIVED: "refund.item_received",
  REFUND_PROCESSING: "refund.processing",
  REFUND_COMPLETED: "refund.completed",
  REFUND_FAILED: "refund.failed",
  REFUND_EXECUTION_UNCERTAIN: "refund.execution.uncertain",
} as const;

export const AUDIT_RESOURCE_TYPES = {
  CATEGORY: "category",
  PRODUCT: "product",
  USER: "user",
  ROLE: "role",
  ORDER: "order",
  PAYMENT_WEBHOOK_EVENT: "payment_webhook_event",
  REFUND: "refund",
} as const;

export const auditActorTypeSchema = z.enum(AUDIT_ACTOR_TYPES);
export const auditActionSchema = z.enum(AUDIT_ACTIONS);
export const auditResourceTypeSchema = z.enum(AUDIT_RESOURCE_TYPES);

export const listAuditLogsQuerySchema = paginatedQuerySchema({
    q: z.string().trim().min(1).max(160).optional(),
    actorUserId: z.uuid().optional(),
    actorType: auditActorTypeSchema.optional(),
    action: auditActionSchema.optional(),
    resourceType: auditResourceTypeSchema.optional(),
    resourceId: z.string().trim().min(1).max(160).optional(),
    from: z.iso.datetime({ offset: true }).optional(),
    to: z.iso.datetime({ offset: true }).optional(),
  })
  .refine(
    (query) =>
      !query.from ||
      !query.to ||
      Date.parse(query.from) <= Date.parse(query.to),
    { message: '"from" must be earlier than or equal to "to"', path: ["from"] },
  );

export const auditLogActorSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
});

export const auditLogSchema = z.object({
  id: z.uuid(),
  actorUserId: z.uuid().nullable(),
  actorType: auditActorTypeSchema,
  actor: auditLogActorSchema.nullable(),
  action: auditActionSchema,
  resourceType: auditResourceTypeSchema,
  resourceId: z.string().nullable(),
  resourceLabel: z.string().nullable(),
  requestId: z.string().nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  metadata: z.unknown().nullable(),
  createdAt: z.iso.datetime(),
});

export const auditLogListResponseSchema = paginatedResponseSchema(auditLogSchema);

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;
export type AuditLogActor = z.infer<typeof auditLogActorSchema>;
export type AuditLog = z.infer<typeof auditLogSchema>;
export type AuditLogListResponse = z.infer<typeof auditLogListResponseSchema>;
export type AuditActorType = z.infer<typeof auditActorTypeSchema>;
export type AuditAction = z.infer<typeof auditActionSchema>;
export type AuditResourceType = z.infer<typeof auditResourceTypeSchema>;
