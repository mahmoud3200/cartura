import "server-only";

import {
  auditLogSchema,
  type AuditLog,
  type ListAuditLogsQuery,
} from "@cartura/contracts/audit-logs";

import {
  fetchManagementPaginated,
  type ManagementPaginationInput,
} from "@/features/management/shared/api/management-api";
export type ManagementAuditLog = AuditLog;

export async function listManagementAuditLogs(
  input: ManagementPaginationInput &
    Pick<ListAuditLogsQuery, "q" | "action" | "resourceType" | "actorType">,
) {
  return fetchManagementPaginated(
    "/api/v1/management/audit-logs",
    auditLogSchema,
    input,
    {
      q: input.q,
      action: input.action,
      resourceType: input.resourceType,
      actorType: input.actorType,
    },
  );
}
