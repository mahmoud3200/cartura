import type { Prisma } from "../../generated/prisma/client.js";
import type {
  AuditAction,
  AuditActorType,
  AuditResourceType,
} from "@cartura/contracts/audit-logs";

export type AuditLogMetadata = Prisma.InputJsonValue;

export type AuditContext = {
  actorUserId?: string | undefined;
  actorType: AuditActorType;
  requestId?: string | undefined;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
};

export type RecordAuditLogInput = AuditContext & {
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string | null | undefined;
  metadata?: AuditLogMetadata | undefined;
};
