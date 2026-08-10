import type { AuditLogWithActor } from "./audit-logs.types.js";

export function getResourceLabel(auditLog: AuditLogWithActor) {
  if (auditLog.resourceType !== "role") {
    return null;
  }

  const metadata = auditLog.metadata;

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const record = metadata as Record<string, unknown>;
  const directName = getString(record.name);

  if (directName) {
    return directName;
  }

  const nextName = getNestedString(record.next, "name");

  if (nextName) {
    return nextName;
  }

  return getNestedString(record.previous, "name");
}

function getNestedString(value: unknown, key: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return getString((value as Record<string, unknown>)[key]);
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}
