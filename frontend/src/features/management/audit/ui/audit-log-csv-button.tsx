"use client";

import type { AuditLog } from "@cartura/contracts/audit-logs";
import { Download } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { exportAuditLogsToCsv } from "../lib/export-audit-logs-to-csv";

export function AuditLogCsvButton({ auditLogs }: { auditLogs: AuditLog[] }) {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={!auditLogs.length}
      onClick={() => {
        const date = new Date().toISOString().slice(0, 10);
        exportAuditLogsToCsv(auditLogs, `audit-logs-${date}.csv`);
      }}
    >
      <Download className="size-4" />
      Download CSV
    </Button>
  );
}
