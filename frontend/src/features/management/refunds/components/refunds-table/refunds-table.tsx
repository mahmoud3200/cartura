import type { Refund } from "@cartura/contracts/refunds";

import { StatusBadge } from "@/features/management/shared/components/admin-ui";
import {
  ManagementTable,
  ManagementTableCell,
} from "@/features/management/shared/components/management-table";
import {
  formatDateTime,
  formatMoney,
  formatStatus,
} from "@/features/management/shared/lib/admin-utils";

import { RefundNotesCell } from "../../ui/refund-notes-cell";
import { RefundActions } from "./refund-actions";

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
  refunds: Refund[];
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
            <p className="font-mono text-xs font-medium">
              {refund.order.orderNumber}
            </p>
            <p className="mt-2 truncate font-medium">{refund.customer.name}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {refund.customer.email}
            </p>
          </ManagementTableCell>
          <ManagementTableCell>
            {refund.order.address ? (
              <address className="text-xs not-italic leading-5 text-muted-foreground">
                <span className="text-foreground">
                  {refund.order.address.recipientName}
                </span>
                <br />
                {refund.order.address.streetAddress}, {refund.order.address.area}
                <br />
                {refund.order.address.city}, {refund.order.address.country}
                <br />
                {refund.order.address.phoneNumber}
              </address>
            ) : (
              <span className="text-xs text-muted-foreground">No address</span>
            )}
          </ManagementTableCell>
          <ManagementTableCell>
            <p className="font-medium">
              {formatStatus(refund.reasonCode ?? "other")}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {formatDateTime(refund.createdAt)}
            </p>
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
