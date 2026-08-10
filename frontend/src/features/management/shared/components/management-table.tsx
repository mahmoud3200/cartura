import type { ReactNode } from "react";

import { EmptyState } from "./admin-ui";
import { cn } from "@/shared/lib/utils";

export type ManagementTableColumn = {
  label: string;
  className?: string;
};

export function ManagementTable<T>({
  items,
  columns,
  gridTemplateColumns,
  getRowKey,
  renderCells,
  emptyLabel,
  minWidth = 720,
}: {
  items: T[];
  columns: ManagementTableColumn[];
  gridTemplateColumns: string;
  getRowKey: (item: T) => string;
  renderCells: (item: T) => ReactNode;
  emptyLabel: string;
  minWidth?: number;
}) {
  if (!items.length) return <EmptyState label={emptyLabel} />;

  const gridStyle = { gridTemplateColumns };

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <div style={{ minWidth }}>
          <div
            className="grid gap-4 border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground"
            style={gridStyle}
          >
            {columns.map((column) => (
              <span key={column.label} className={column.className}>
                {column.label}
              </span>
            ))}
          </div>
          <div className="divide-y divide-border">
            {items.map((item) => (
              <div
                key={getRowKey(item)}
                className="grid items-center gap-4 px-4 py-4 text-sm"
                style={gridStyle}
              >
                {renderCells(item)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ManagementTableCell({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("min-w-0", className)}>{children}</div>;
}
