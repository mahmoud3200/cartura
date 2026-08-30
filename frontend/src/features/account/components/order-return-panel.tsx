import type { OrderSummary } from "@cartura/contracts/orders";
import type { CustomerRefund } from "@cartura/contracts/refunds";

import { getOrderReturnPanelState } from "../lib/order-return";
import { OrderReturnRequestForm } from "../ui/order-return-request-form";
import { OrderReturnStatus } from "../ui/order-return-status";
import { OrderReturnUnavailable } from "../ui/order-return-unavailable";

type OrderReturnPanelProps = {
  order: OrderSummary;
  refunds: CustomerRefund[];
};

export function OrderReturnPanel({ order, refunds }: OrderReturnPanelProps) {
  const state = getOrderReturnPanelState(order, refunds);

  switch (state.kind) {
    case "request":
      return (
        <OrderReturnRequestForm
          order={order}
          deadline={state.deadline}
          previousRejection={state.previousRejection}
        />
      );
    case "status":
      return <OrderReturnStatus refund={state.refund} />;
    case "unavailable":
      return <OrderReturnUnavailable message={state.message} />;
  }
}
