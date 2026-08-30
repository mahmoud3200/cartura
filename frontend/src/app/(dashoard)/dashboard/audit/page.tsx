import {
  auditActorTypeSchema,
  auditResourceTypeSchema,
} from "@cartura/contracts/audit-logs";

import { listManagementAuditLogs } from "@/features/management/audit/api/audit-api";
import { AuditLogFilters } from "@/features/management/audit/components/audit-log-filters";
import { AuditLogsTable } from "@/features/management/audit/components/audit-logs-table";
import { isAuditActionForResource } from "@/features/management/audit/lib/audit-actions";
import { AuditLogCsvButton } from "@/features/management/audit/ui/audit-log-csv-button";
import { PageHeader } from "@/features/management/shared/components/admin-ui";
import { PaginationControls } from "@/shared/ui/pagination-controls";
import {
  getManagementPage,
  getManagementFilter,
  getManagementQuery,
  type ManagementSearchParams,
} from "@/features/management/shared/lib/management-search-params";
import { requireManagementRouteAccess } from "@/features/management/shared/lib/require-management-access";

const AUDIT_LOGS_PAGE_SIZE = 40;

export default async function AuditPage({
  searchParams,
}: {
  searchParams: ManagementSearchParams;
}) {
  const params = await searchParams;
  const query = getManagementQuery(params.q);
  const resourceTypeResult = auditResourceTypeSchema.safeParse(
    getManagementFilter(params.resourceType),
  );
  const resourceType = resourceTypeResult.success
    ? resourceTypeResult.data
    : undefined;
  const requestedAction = getManagementFilter(params.action);
  const action = isAuditActionForResource(resourceType, requestedAction)
    ? requestedAction
    : undefined;
  const actorTypeResult = auditActorTypeSchema.safeParse(
    getManagementFilter(params.actorType),
  );
  const actorType = actorTypeResult.success ? actorTypeResult.data : undefined;
  await requireManagementRouteAccess("/dashboard/audit");

  const auditLogs = await listManagementAuditLogs({
    page: getManagementPage(params.page),
    limit: AUDIT_LOGS_PAGE_SIZE,
    q: query,
    action,
    actorType,
    resourceType,
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Audit"
        description="Read recent administrative actions, affected resources, actor identity, and request context."
        action={<AuditLogCsvButton auditLogs={auditLogs.data} />}
      />
      <AuditLogFilters
        key={`${query ?? ""}:${resourceType ?? "all"}:${action ?? "all"}:${actorType ?? "all"}`}
        query={query}
        resourceType={resourceType}
        action={action}
        actorType={actorType}
      />
      <AuditLogsTable auditLogs={auditLogs.data} />
      <PaginationControls pagination={auditLogs.pagination} />
    </div>
  );
}
