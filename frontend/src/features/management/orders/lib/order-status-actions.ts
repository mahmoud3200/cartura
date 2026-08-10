import type { ManageableOrderStatus } from "@cartura/contracts/orders";

type OrderStatusContext = {
  status: string;
  payment: {
    paymentMethod?: string | undefined;
    status: string;
  } | null;
};

export function getNextOrderStatuses(
  order: OrderStatusContext,
): readonly ManageableOrderStatus[] {
  const cashOnDelivery =
    order.payment?.paymentMethod === "cash_on_delivery";
  const paid = order.payment?.status === "paid";

  switch (order.status) {
    case "pending":
      return cashOnDelivery
        ? ["processing", "cancelled"]
        : ["cancelled"];
    case "confirmed":
      return cashOnDelivery
        ? ["processing", "cancelled"]
        : paid
          ? ["processing"]
          : [];
    case "paid":
      return paid ? ["processing"] : [];
    case "payment_failed":
      return ["cancelled"];
    case "processing":
      return cashOnDelivery ? ["shipped", "cancelled"] : ["shipped"];
    case "shipped":
      return ["completed"];
    default:
      return [];
  }
}

export function getOrderStatusActionLabel(status: ManageableOrderStatus) {
  switch (status) {
    case "processing":
      return "Start preparing";
    case "shipped":
      return "Mark as shipped";
    case "completed":
      return "Mark delivered";
    case "cancelled":
      return "Cancel order";
  }
}
