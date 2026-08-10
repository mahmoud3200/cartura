import { notFound } from "next/navigation";

import { getCustomerOrder } from "@/features/account/api/orders-api";
import { listCustomerRefunds } from "@/features/account/api/refunds-api";
import { OrderDetail } from "@/features/account/components/order-detail";
import { ApiError } from "@/shared/api/server-api";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await getOrderOrNotFound(orderId);
  const refunds = await listCustomerRefunds(orderId);

  return <OrderDetail order={order} refunds={refunds.data} />;
}

async function getOrderOrNotFound(orderId: string) {
  try {
    return await getCustomerOrder(orderId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}
