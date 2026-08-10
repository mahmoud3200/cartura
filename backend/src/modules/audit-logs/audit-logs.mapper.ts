import type { AuditLog } from "@cartura/contracts/audit-logs";
import type { AuditLogWithActor } from "./audit-logs.types.js";
import { getResourceLabel } from "./audit-logs.utils.js";

export function mapAuditLog(auditLog: AuditLogWithActor): AuditLog {
  return {
    id: auditLog.id,
    actorUserId: auditLog.actorUserId,
    actorType: auditLog.actorType,
    actor: auditLog.actor
      ? {
          id: auditLog.actor.id,
          name: auditLog.actor.name,
          firstName: auditLog.actor.firstName,
          lastName: auditLog.actor.lastName,
          email: auditLog.actor.email,
        }
      : null,
    action: auditLog.action,
    resourceType: auditLog.resourceType,
    resourceId: auditLog.resourceId,
    resourceLabel: getResourceLabel(auditLog),
    requestId: auditLog.requestId,
    ipAddress: auditLog.ipAddress,
    userAgent: auditLog.userAgent,
    metadata: auditLog.metadata,
    createdAt: auditLog.createdAt.toISOString(),
  };
}
