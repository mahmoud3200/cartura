import type { ManagementRefund } from "../api/refunds-api";

export function RefundNotesCell({ refund }: { refund: ManagementRefund }) {
  const notes = [
    refund.customerNote
      ? { label: "Customer", value: refund.customerNote, destructive: false }
      : null,
    refund.reviewNote
      ? {
          label: refund.status === "rejected" ? "Rejection" : "Staff",
          value: refund.reviewNote,
          destructive: refund.status === "rejected",
        }
      : null,
    refund.failureReason
      ? { label: "Failure", value: refund.failureReason, destructive: true }
      : null,
  ].filter((note): note is NonNullable<typeof note> => note !== null);

  if (!notes.length) {
    return <span className="text-xs text-muted-foreground">No notes</span>;
  }

  return (
    <dl className="grid gap-3 text-xs">
      {notes.map((note) => (
        <div key={note.label}>
          <dt
            className={
              note.destructive
                ? "font-semibold text-destructive"
                : "font-semibold text-muted-foreground"
            }
          >
            {note.label}
          </dt>
          <dd className="mt-1 whitespace-pre-wrap leading-5 text-foreground">
            {note.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
