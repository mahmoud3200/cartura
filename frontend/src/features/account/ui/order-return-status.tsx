import type { Refund } from "@cartura/contracts/refunds";
import { CalendarClock, PackageCheck } from "lucide-react";
import type { ReactNode } from "react";

import {
  formatAccountDate,
  formatAccountMoney,
  formatOrderStatus,
} from "../lib/account-formatters";
import { getRefundReasonLabel } from "../lib/order-return";
import { OrderRefundNotes } from "./order-refund-notes";

export function OrderReturnStatus({ refund }: { refund: Refund }) {
  const pickup = refund.resolution === "pickup";

  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <PackageCheck className="mt-0.5 size-5" strokeWidth={1.7} />
          <div>
            <h2 className="font-semibold">Return status</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Requested {formatAccountDate(refund.createdAt)}
            </p>
          </div>
        </div>
        <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-semibold">
          {formatOrderStatus(refund.status)}
        </span>
      </div>

      <dl className="mt-5 grid gap-3 text-sm">
        <StatusRow
          label="Reason"
          value={getRefundReasonLabel(refund.reasonCode)}
        />
        <StatusRow
          label="Refund method"
          value={refund.refundMethod === "cash" ? "Cash" : "Original card"}
        />
        <StatusRow
          label="Amount"
          value={formatAccountMoney(refund.amount, refund.currency)}
        />
        {pickup && refund.pickupScheduledAt ? (
          <StatusRow
            label="Pickup"
            value={formatAccountDate(refund.pickupScheduledAt)}
            icon={<CalendarClock className="size-4" />}
          />
        ) : null}
      </dl>

      <OrderRefundNotes
        refund={refund}
        className="mt-4 border-t border-border pt-4"
      />
    </section>
  );
}

function StatusRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="flex items-center gap-2 text-right font-medium">
        {icon}
        {value}
      </dd>
    </div>
  );
}
