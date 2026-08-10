import type { AuditLog } from "@cartura/contracts/audit-logs";

const auditCsvHeaders = [
  "ID",
  "Actor",
  "Actor Email",
  "Actor Type",
  "Action",
  "Resource",
  "Resource ID",
  "IP Address",
  "Request ID",
  "Timestamp",
  "Metadata",
];

export function createAuditLogsCsv(logs: AuditLog[]) {
  const rows = logs.map((log) => [
    log.id,
    log.actor?.name ?? "Unknown",
    log.actor?.email ?? "",
    log.actorType,
    log.action,
    log.resourceLabel ?? log.resourceType,
    log.resourceId ?? "",
    log.ipAddress ?? "",
    log.requestId ?? "",
    new Date(log.createdAt).toISOString(),
    log.metadata === null ? "" : JSON.stringify(log.metadata),
  ]);

  return [auditCsvHeaders, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n");
}

export function exportAuditLogsToCsv(
  logs: AuditLog[],
  filename = "audit-logs.csv",
) {
  if (!logs.length) return;

  const csv = createAuditLogsCsv(logs);
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.hidden = true;
  document.body.appendChild(link);

  try {
    link.click();
  } finally {
    link.remove();
    URL.revokeObjectURL(url);
  }
}

function escapeCsvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}
