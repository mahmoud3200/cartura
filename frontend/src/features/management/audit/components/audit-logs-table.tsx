import {
  ManagementTable,
  ManagementTableCell,
} from "@/features/management/shared/components/management-table";
import { formatDateTime } from "@/features/management/shared/lib/admin-utils";
import { AuditActionBadge } from "../ui/audit-action-badge";

const columns = [
  { label: "Action" },
  { label: "Actor" },
  { label: "Resource" },
  { label: "Time", className: "text-center" },
];

export function AuditLogsTable({ auditLogs }: { auditLogs: AuditLog[] }) {
  return (
    <ManagementTable
      items={auditLogs}
      columns={columns}
      gridTemplateColumns="1fr 1fr 0.8fr 0.9fr"
      getRowKey={(log) => log.id}
      emptyLabel="No audit logs have been recorded yet."
      renderCells={(log) => (
        <>
          <ManagementTableCell>
            <AuditActionBadge action={log.action} />
            <p className="mt-1 text-xs text-muted-foreground">
              {log.ipAddress ?? "No IP"}
            </p>
          </ManagementTableCell>
          <ManagementTableCell>
            <p className="truncate">{log.actor?.name ?? log.actorType}</p>
            <p className="truncate text-xs text-muted-foreground">
              {log.actor?.email ?? "system"}
            </p>
          </ManagementTableCell>
          <ManagementTableCell>
            <p>{log.resourceType.replaceAll("_", " ")}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {getResourceDisplay(log)}
            </p>
          </ManagementTableCell>
          <p className="text-center text-xs text-muted-foreground">
            {formatDateTime(log.createdAt)}
          </p>
        </>
      )}
    />
  );
}

function getResourceDisplay(log: AuditLog) {
  if (log.resourceLabel) return log.resourceLabel;
  if (!log.resourceId) return "none";
  return `id ${shortenId(log.resourceId)}`;
}

function shortenId(value: string) {
  if (value.length <= 12) return value;
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}
import type { AuditLog } from "@cartura/contracts/audit-logs";
