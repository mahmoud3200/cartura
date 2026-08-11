import { redirect } from "next/navigation";
import { connection } from "next/server";

import { listCustomerOrders } from "@/features/account/api/orders-api";
import { getCurrentAuthUser } from "@/features/auth/api/auth-api";

import { getCheckoutPaymentState } from "../lib/checkout-result";
import { CheckoutResultCard } from "../ui/checkout-result-card";

export type CheckoutResultSearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

export async function CheckoutResultPage({
  searchParams,
}: {
  searchParams: CheckoutResultSearchParams;
}) {
  await connection();
  const user = await getCurrentAuthUser();

  if (!user) {
    redirect("/auth/login?redirect=/checkout/result");
  }

  const params = await searchParams;
  const merchantOrderId =
    typeof params.merchant_order_id === "string"
      ? params.merchant_order_id
      : null;
  const order = merchantOrderId
    ? await findCheckoutOrder(merchantOrderId)
    : null;

  return (
    <CheckoutResultCard
      state={getCheckoutPaymentState(order)}
      orderId={order?.id ?? null}
      orderNumber={merchantOrderId}
    />
  );
}

async function findCheckoutOrder(merchantOrderId: string) {
  try {
    const orders = await listCustomerOrders({
      limit: 1,
      q: merchantOrderId,
    });

    return (
      orders.data.find((order) => order.orderNumber === merchantOrderId) ?? null
    );
  } catch {
    return null;
  }
}
