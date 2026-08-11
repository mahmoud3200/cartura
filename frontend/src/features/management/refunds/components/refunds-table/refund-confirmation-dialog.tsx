"use client";

import { CheckCheck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/shared/ui/button";

export function RefundConfirmationDialog({
  title,
  description,
  confirmLabel,
  isPending,
  includeNote = false,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  isPending: boolean;
  includeNote?: boolean;
  onCancel: () => void;
  onConfirm: (note?: string) => void;
}) {
  const [note, setNote] = useState("");

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
        <CheckCheck className="size-5" strokeWidth={1.7} />
        <h2 className="mt-3 text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
        {includeNote ? (
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Receiving note (optional)"
            className="mt-4 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => onConfirm(note.trim() || undefined)}
            disabled={isPending}
          >
            {isPending ? "Saving..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
