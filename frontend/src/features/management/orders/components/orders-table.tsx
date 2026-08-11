"use client";

import type { OrderSummary } from "@cartura/contracts/orders";
import type { ManageableOrderStatus } from "@cartura/contracts/orders";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { StatusBadge } from "@/features/management/shared/components/admin-ui";
import { ManagementTableActions } from "@/features/management/shared/components/management-table-actions";
import {
  ManagementTable,
  ManagementTableCell,
} from "@/features/management/shared/components/management-table";
import {
  formatDateTime,
  formatMoney,
} from "@/features/management/shared/lib/admin-utils";
import { updateOrderStatusAction } from "../actions/update-order-status.action";
import {
  getNextOrderStatuses,
  getOrderStatusActionLabel,
} from "../lib/order-status-actions";

const columns = [
  { label: "Order" },
  { label: "Customer" },
  { label: "Delivery address" },
  { label: "Status" },
  { label: "Payment" },
  { label: "Total", className: "text-right" },
  { label: "Action", className: "text-right" },
];

export function OrdersTable({
  orders,
  canUpdateOrders,
}: {
  orders: OrderSummary[];
  canUpdateOrders: boolean;
}) {
  return (
    <ManagementTable
      items={orders}
      columns={columns}
      gridTemplateColumns="0.85fr 1.05fr 1.3fr 0.65fr 0.7fr 0.75fr 1fr"
      minWidth={1120}
      getRowKey={(order) => order.id}
      emptyLabel="No orders have been created yet."
      renderCells={(order) => (
        <>
          <ManagementTableCell>
            <p className="font-mono">{order.orderNumber}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDateTime(order.createdAt)}
            </p>
          </ManagementTableCell>
          <ManagementTableCell>
            <p className="truncate font-medium">{order.customer.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {order.customer.email}
            </p>
          </ManagementTableCell>
          <ManagementTableCell>
            {order.address ? (
              <div title={formatDeliveryAddress(order.address)}>
                <p className="truncate font-medium">
                  {order.address.recipientName}
                </p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                  {formatDeliveryAddress(order.address)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {order.address.phoneNumber}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No address attached
              </p>
            )}
          </ManagementTableCell>
          <ManagementTableCell className="flex h-full items-center">
            <StatusBadge status={order.status} />
          </ManagementTableCell>
          <ManagementTableCell className="flex h-full flex-col items-start justify-center gap-1.5">
            <StatusBadge status={order.payment?.status ?? "no_payment"} />
            <p className="text-xs leading-5 text-muted-foreground">
              {order.payment?.paymentMethod === "cash_on_delivery"
                ? "Cash on delivery"
                : "Card"}
            </p>
          </ManagementTableCell>
          <ManagementTableCell className="flex h-full items-center justify-end text-right">
            <p className="font-mono tabular-nums">
              {formatMoney(order.totalAmount, order.currency)}
            </p>
          </ManagementTableCell>
          <OrderStatusAction
            order={order}
            canUpdate={canUpdateOrders}
          />
        </>
      )}
    />
  );
}

function formatDeliveryAddress(
  address: NonNullable<OrderSummary["address"]>,
) {
  return [
    address.streetAddress,
    address.area,
    address.city,
    address.country,
    address.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
}

function OrderStatusAction({
  order,
  canUpdate,
}: {
  order: OrderSummary;
  canUpdate: boolean;
}) {
  const router = useRouter();
  const options = getNextOrderStatuses(order);
  const [isPending, startTransition] = useTransition();

  if (!canUpdate || options.length === 0) {
    return (
      <ManagementTableCell className="flex h-full items-center justify-end">
        <span aria-hidden="true" />
      </ManagementTableCell>
    );
  }

  return (
    <ManagementTableCell className="flex h-full items-center justify-end">
      <ManagementTableActions
        label={`Actions for order ${order.orderNumber}`}
        isPending={isPending}
        actions={options.map((status) => ({
          label: getOrderStatusActionLabel(status),
          destructive: status === "cancelled",
          onSelect: () => updateStatus(status),
        }))}
      />
    </ManagementTableCell>
  );

  function updateStatus(status: ManageableOrderStatus) {
    startTransition(async () => {
      const result = await updateOrderStatusAction(order.id, { status });

      if (!result.ok) {
        toast.error("Order was not updated", {
          description: result.message,
        });
        return;
      }

      toast.success("Order status updated");
      router.refresh();
    });
  }
}
