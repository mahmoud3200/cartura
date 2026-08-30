import type { CustomerRefund } from "@cartura/contracts/refunds";

import { cn } from "@/shared/lib/utils";

type OrderRefundNotesProps = {
  refund: CustomerRefund;
  className?: string;
};

export function OrderRefundNotes({
  refund,
  className,
}: OrderRefundNotesProps) {
  const notes = [
    refund.customerNote
      ? { label: "Your note", value: refund.customerNote, destructive: false }
      : null,
    refund.reviewNote
      ? {
          label:
            refund.status === "rejected"
              ? "Reason for rejection"
              : "Review note",
          value: refund.reviewNote,
          destructive: refund.status === "rejected",
        }
      : null,
  ].filter((note): note is NonNullable<typeof note> => note !== null);

  if (!notes.length) {
    return null;
  }

  return (
    <dl className={cn("grid gap-3", className)}>
      {notes.map((note) => (
        <div key={note.label}>
          <dt
            className={cn(
              "text-xs font-semibold",
              note.destructive ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {note.label}
          </dt>
          <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-foreground">
            {note.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
