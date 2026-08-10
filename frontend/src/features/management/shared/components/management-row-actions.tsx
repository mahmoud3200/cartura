"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { ManagementTableActions } from "./management-table-actions";
import { Button } from "@/shared/ui/button";

export function ManagementRowActions({
  editHref,
  canDelete,
  isDeleting,
  resourceLabel,
  onDelete,
}: {
  editHref?: string;
  canDelete: boolean;
  isDeleting: boolean;
  resourceLabel: string;
  onDelete: () => void;
}) {
  const [isConfirming, setIsConfirming] = useState(false);

  if (!editHref && !canDelete) return <span aria-hidden="true" />;

  return (
    <div className="relative">
      <ManagementTableActions
        label={`Actions for ${resourceLabel}`}
        isPending={isDeleting}
        actions={[
          ...(editHref
            ? [
                {
                  label: "Edit",
                  href: editHref,
                  icon: Pencil,
                },
              ]
            : []),
          ...(canDelete
            ? [
                {
                  label: "Delete",
                  icon: Trash2,
                  destructive: true,
                  onSelect: () => setIsConfirming(true),
                },
              ]
            : []),
        ]}
      />
      {isConfirming ? (
        <ManagementDeleteConfirmation
          resourceLabel={resourceLabel}
          isDeleting={isDeleting}
          onConfirm={onDelete}
          onCancel={() => setIsConfirming(false)}
        />
      ) : null}
    </div>
  );
}

function ManagementDeleteConfirmation({
  resourceLabel,
  isDeleting,
  onConfirm,
  onCancel,
}: {
  resourceLabel: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="management-delete-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-sm rounded-xl border border-destructive/30 bg-card p-5 shadow-lg">
        <p
          id="management-delete-title"
          className="text-base font-semibold text-destructive"
        >
          Delete {resourceLabel}?
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          This action cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete permanently"}
          </Button>
        </div>
      </div>
    </div>
  );
}
