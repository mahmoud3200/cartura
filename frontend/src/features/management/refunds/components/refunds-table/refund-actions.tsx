"use client";

import type { Refund } from "@cartura/contracts/refunds";
import { CreditCard, PackageCheck, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ManagementTableActions } from "@/features/management/shared/components/management-table-actions";
import type { ManagementTableAction } from "@/features/management/shared/components/management-table-actions";
import { formatMoney } from "@/features/management/shared/lib/admin-utils";

import { confirmReturnReceivedAction } from "../../actions/confirm-return-received.action";
import { executeRefundAction } from "../../actions/execute-refund.action";
import { RefundConfirmationDialog } from "./refund-confirmation-dialog";
import { RefundReviewDialog } from "./refund-review-dialog";

export function RefundActions({
  refund,
  canManage,
}: {
  refund: Refund;
  canManage: boolean;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<"review" | "receive" | "issue" | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  if (!canManage) return <span aria-hidden="true" />;

  const actions = getRefundActions(refund, setDialog);
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
        <RefundConfirmationDialog
          title="Confirm returned items arrived"
          description="This immediately adds every item from the order back to inventory. Only confirm after checking the parcel."
          confirmLabel="Receive and restock"
          isPending={isPending}
          onCancel={() => setDialog(null)}
          onConfirm={(note) =>
            startTransition(async () => {
              const result = await confirmReturnReceivedAction(refund.id, note);
              if (!result.ok) {
                toast.error("Return not received", {
                  description: result.message,
                });
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
        <RefundConfirmationDialog
          title="Issue this refund"
          description={
            refund.refundMethod === "cash"
              ? `Confirm ${formatMoney(refund.amount, refund.currency)} was returned to the customer in cash.`
              : `Send ${formatMoney(refund.amount, refund.currency)} back to the original card through Paymob.`
          }
          confirmLabel={
            refund.refundMethod === "cash"
              ? "Confirm cash returned"
              : "Refund original card"
          }
          isPending={isPending}
          onCancel={() => setDialog(null)}
          onConfirm={() =>
            startTransition(async () => {
              const result = await executeRefundAction(refund.id);
              if (!result.ok) {
                toast.error("Refund not completed", {
                  description: result.message,
                });
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

function getRefundActions(
  refund: Refund,
  setDialog: (dialog: "review" | "receive" | "issue") => void,
): ManagementTableAction[] {
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

  return actions;
}
