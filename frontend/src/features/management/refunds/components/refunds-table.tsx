"use client";

import { CheckCheck, CreditCard, PackageCheck, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { StatusBadge } from "@/features/management/shared/components/admin-ui";
import { ManagementTableActions } from "@/features/management/shared/components/management-table-actions";
import type { ManagementTableAction } from "@/features/management/shared/components/management-table-actions";
import {
  ManagementTable,
  ManagementTableCell,
} from "@/features/management/shared/components/management-table";
import {
  formatDateTime,
  formatMoney,
  formatStatus,
} from "@/features/management/shared/lib/admin-utils";
import { confirmReturnReceivedAction } from "../actions/confirm-return-received.action";
import { executeRefundAction } from "../actions/execute-refund.action";
import type { ManagementRefund } from "../api/refunds-api";
import { RefundNotesCell } from "../ui/refund-notes-cell";
import { RefundReviewDialog } from "./refund-review-dialog";

const columns = [
  { label: "Order and customer" },
  { label: "Delivery address" },
  { label: "Request" },
  { label: "Notes" },
  { label: "Status" },
  { label: "Refund", className: "text-right" },
  { label: "Action", className: "text-right" },
];

export function RefundsTable({
  refunds,
  canManageRefunds,
}: {
  refunds: ManagementRefund[];
  canManageRefunds: boolean;
}) {
  return (
    <ManagementTable
      items={refunds}
      columns={columns}
      gridTemplateColumns="1.05fr 1.25fr 0.85fr 1.2fr 0.75fr 0.75fr 0.4fr"
      minWidth={1500}
      getRowKey={(refund) => refund.id}
      emptyLabel="No return requests match these filters."
      renderCells={(refund) => (
        <>
          <ManagementTableCell>
            <p className="font-mono text-xs font-medium">{refund.order.orderNumber}</p>
            <p className="mt-2 truncate font-medium">{refund.customer.name}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{refund.customer.email}</p>
          </ManagementTableCell>
          <ManagementTableCell>
            {refund.order.address ? (
              <address className="text-xs not-italic leading-5 text-muted-foreground">
                <span className="text-foreground">{refund.order.address.recipientName}</span><br />
                {refund.order.address.streetAddress}, {refund.order.address.area}<br />
                {refund.order.address.city}, {refund.order.address.country}<br />
                {refund.order.address.phoneNumber}
              </address>
            ) : (
              <span className="text-xs text-muted-foreground">No address</span>
            )}
          </ManagementTableCell>
          <ManagementTableCell>
            <p className="font-medium">{formatStatus(refund.reasonCode ?? "other")}</p>
            <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(refund.createdAt)}</p>
          </ManagementTableCell>
          <ManagementTableCell>
            <RefundNotesCell refund={refund} />
          </ManagementTableCell>
          <ManagementTableCell>
            <StatusBadge status={refund.status} />
            {refund.pickupScheduledAt ? (
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Pickup {formatDateTime(refund.pickupScheduledAt)}
              </p>
            ) : null}
          </ManagementTableCell>
          <ManagementTableCell className="text-right">
            <p className="font-mono font-medium tabular-nums">
              {formatMoney(refund.amount, refund.currency)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {refund.refundMethod === "cash" ? "Cash" : "Original card"}
            </p>
          </ManagementTableCell>
          <RefundActions refund={refund} canManage={canManageRefunds} />
        </>
      )}
    />
  );
}

function RefundActions({
  refund,
  canManage,
}: {
  refund: ManagementRefund;
  canManage: boolean;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<"review" | "receive" | "issue" | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!canManage) return <span aria-hidden="true" />;

  const actions: ManagementTableAction[] = [];
  if (refund.status === "requested") {
    actions.push({
      label: "Review request",
      icon: RotateCcw,
      onSelect: () => setDialog("review"),
    });
  }
  if (refund.status === "pickup_scheduled") {
    actions.push({
      label: "Mark items received",
      icon: PackageCheck,
      onSelect: () => setDialog("receive"),
    });
  }
  if (["approved", "item_received"].includes(refund.status)) {
    actions.push({
      label: "Issue refund",
      icon: CreditCard,
      onSelect: () => setDialog("issue"),
    });
  }

  const closeAndRefresh = () => {
    setDialog(null);
    router.refresh();
  };

  return (
    <>
      <ManagementTableActions
        label={`Actions for return ${refund.order.orderNumber}`}
        actions={actions}
        isPending={isPending}
      />
      {dialog === "review" ? (
        <RefundReviewDialog
          refund={refund}
          onClose={() => setDialog(null)}
          onSaved={closeAndRefresh}
        />
      ) : null}
      {dialog === "receive" ? (
        <ConfirmationDialog
          title="Confirm returned items arrived"
          description="This immediately adds every item from the order back to inventory. Only confirm after checking the parcel."
          confirmLabel="Receive and restock"
          isPending={isPending}
          onCancel={() => setDialog(null)}
          onConfirm={(note) =>
            startTransition(async () => {
              const result = await confirmReturnReceivedAction(refund.id, note);
              if (!result.ok) {
                toast.error("Return not received", { description: result.message });
                return;
              }
              toast.success("Items received and inventory restored");
              closeAndRefresh();
            })
          }
          includeNote
        />
      ) : null}
      {dialog === "issue" ? (
        <ConfirmationDialog
          title="Issue this refund"
          description={
            refund.refundMethod === "cash"
              ? `Confirm ${formatMoney(refund.amount, refund.currency)} was returned to the customer in cash.`
              : `Send ${formatMoney(refund.amount, refund.currency)} back to the original card through Paymob.`
          }
          confirmLabel={refund.refundMethod === "cash" ? "Confirm cash returned" : "Refund original card"}
          isPending={isPending}
          onCancel={() => setDialog(null)}
          onConfirm={() =>
            startTransition(async () => {
              const result = await executeRefundAction(refund.id);
              if (!result.ok) {
                toast.error("Refund not completed", { description: result.message });
                return;
              }
              toast.success(
                result.data.status === "processing"
                  ? "Refund is processing"
                  : "Refund completed",
              );
              closeAndRefresh();
            })
          }
        />
      ) : null}
    </>
  );
}

function ConfirmationDialog({
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
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
        <CheckCheck className="size-5" strokeWidth={1.7} />
        <h2 className="mt-3 text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
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
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>Cancel</Button>
          <Button type="button" onClick={() => onConfirm(note.trim() || undefined)} disabled={isPending}>
            {isPending ? "Saving..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
