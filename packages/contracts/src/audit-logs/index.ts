import { z } from "zod";
import {
  paginatedResponseSchema,
  paginationQuerySchema,
} from "../common/index.js";

export const listAuditLogsQuerySchema = paginationQuerySchema.and(z.object({
  q: z.string().trim().min(1).max(160).optional(),
  actorUserId: z.uuid().optional(),
  actorType: z.string().trim().min(1).max(80).optional(),
  action: z.string().trim().min(1).max(120).optional(),
  resourceType: z.string().trim().min(1).max(120).optional(),
  resourceId: z.string().trim().min(1).max(160).optional(),
  from: z.iso.datetime().optional(),
  to: z.iso.datetime().optional(),
}));

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
  actorType: z.string(),
  actor: auditLogActorSchema.nullable(),
  action: z.string(),
  resourceType: z.string(),
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
