import { cn } from "@/shared/lib/utils";
import {
  formatAuditAction,
  getAuditActionClass,
} from "../lib/audit-actions";

export function AuditActionBadge({ action }: { action: string }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit rounded-sm px-2 py-1 text-xs font-medium",
        getAuditActionClass(action),
      )}
    >
      {formatAuditAction(action)}
    </span>
  );
}
