"use client";

import type { ManagementRefund } from "@cartura/contracts/refunds";
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
import {
  getRefundExecutionFeedback,
  getRefundManagementActions,
} from "./refund-management";
import { RefundReviewDialog } from "./refund-review-dialog";

export function RefundActions({
  refund,
  canManage,
}: {
  refund: ManagementRefund;
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
          title={
            refund.status === "failed"
              ? "Retry this refund"
              : "Issue this refund"
          }
          description={
            refund.refundMethod === "cash"
              ? `Confirm ${formatMoney(refund.amount, refund.currency)} was returned to the customer in cash.`
              : `Send ${formatMoney(refund.amount, refund.currency)} back to the original card through Paymob.`
          }
          confirmLabel={
            refund.refundMethod === "cash"
              ? "Confirm cash returned"
              : refund.status === "failed"
                ? "Retry card refund"
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
              const feedback = getRefundExecutionFeedback(result.data);

              if (feedback.kind === "success") {
                toast.success(feedback.title);
              } else {
                toast.error(feedback.title, {
                  description: feedback.description,
                });
              }
              closeAndRefresh();
            })
          }
        />
      ) : null}
    </>
  );
}

function getRefundActions(
  refund: ManagementRefund,
  setDialog: (dialog: "review" | "receive" | "issue") => void,
): ManagementTableAction[] {
  return getRefundManagementActions(refund).map((action) => {
    switch (action) {
      case "review":
        return {
          label: "Review request",
          icon: RotateCcw,
          onSelect: () => setDialog("review"),
        };
      case "receive":
        return {
          label: "Mark items received",
          icon: PackageCheck,
          onSelect: () => setDialog("receive"),
        };
      case "issue":
        return {
          label: refund.status === "failed" ? "Retry refund" : "Issue refund",
          icon: CreditCard,
          onSelect: () => setDialog("issue"),
        };
    }
  });
}
