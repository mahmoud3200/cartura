import {
  auditActionSchema,
  auditActorTypeSchema,
  auditResourceTypeSchema,
  type AuditLog,
} from "@cartura/contracts/audit-logs";
import type { AuditLogWithActor } from "./audit-logs.repository.js";
import { getResourceLabel } from "./audit-logs.utils.js";

export function mapAuditLog(auditLog: AuditLogWithActor): AuditLog {
  const actor = getActorSnapshot(auditLog);

  return {
    id: auditLog.id,
    actorUserId: auditLog.actorUserId,
    actorType: auditActorTypeSchema.parse(auditLog.actorType),
    actor,
    action: auditActionSchema.parse(auditLog.action),
    resourceType: auditResourceTypeSchema.parse(auditLog.resourceType),
    resourceId: auditLog.resourceId,
    resourceLabel: getResourceLabel(auditLog),
    requestId: auditLog.requestId,
    ipAddress: auditLog.ipAddress,
    userAgent: auditLog.userAgent,
    metadata: auditLog.metadata,
    createdAt: auditLog.createdAt.toISOString(),
  };
}

function getActorSnapshot(auditLog: AuditLogWithActor): AuditLog["actor"] {
  if (
    auditLog.actorIdSnapshot !== null &&
    auditLog.actorNameSnapshot !== null &&
    auditLog.actorFirstNameSnapshot !== null &&
    auditLog.actorLastNameSnapshot !== null &&
    auditLog.actorEmailSnapshot !== null
  ) {
    return {
      id: auditLog.actorIdSnapshot,
      name: auditLog.actorNameSnapshot,
      firstName: auditLog.actorFirstNameSnapshot,
      lastName: auditLog.actorLastNameSnapshot,
      email: auditLog.actorEmailSnapshot,
    };
  }

  return auditLog.actor
    ? {
        id: auditLog.actor.id,
        name: auditLog.actor.name,
        firstName: auditLog.actor.firstName,
        lastName: auditLog.actor.lastName,
        email: auditLog.actor.email,
      }
    : null;
}
