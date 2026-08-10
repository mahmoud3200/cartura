import { CheckCircle2, XCircle, Clock } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { listCustomerOrders } from "@/features/account/api/orders-api";
import { Button } from "@/shared/ui/button";
import { getCurrentAuthUser } from "@/features/auth/api/auth-api";

type CheckoutResultPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default function CheckoutResultPage({
  searchParams,
}: CheckoutResultPageProps) {
  return (
    <Suspense fallback={<CheckoutResultFallback />}>
      <CheckoutResultContent searchParams={searchParams} />
    </Suspense>
  );
}

async function CheckoutResultContent({
  searchParams,
}: CheckoutResultPageProps) {
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

  // Try to find the order if we have a merchant_order_id
  let order: Awaited<ReturnType<typeof listCustomerOrders>>["data"][number] | null =
    null;
  const orderNumber: string | null = merchantOrderId;

  if (merchantOrderId) {
    try {
      const orders = await listCustomerOrders({
        limit: 1,
        q: merchantOrderId,
      });
      order =
        orders.data.find(
          (candidate) => candidate.orderNumber === merchantOrderId,
        ) ?? null;
    } catch {
      // The result page remains useful even when order lookup is unavailable.
    }
  }
  const state = getVerifiedPaymentState(order);
  const orderId = order?.id ?? null;

  return (
    <main className="flex min-h-[70dvh] flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mb-6 flex justify-center">
          {state === "paid" ? (
            <div className="rounded-full bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-500">
              <CheckCircle2 className="size-12" strokeWidth={1.5} />
            </div>
          ) : state === "verifying" ? (
            <div className="rounded-full bg-amber-100 p-3 text-amber-600 dark:bg-amber-900/30 dark:text-amber-500">
              <Clock className="size-12" strokeWidth={1.5} />
            </div>
          ) : (
            <div className="rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-900/30 dark:text-red-500">
              <XCircle className="size-12" strokeWidth={1.5} />
            </div>
          )}
        </div>

        <h1 className="mb-2 text-2xl font-bold tracking-tight">
          {state === "paid"
            ? "Payment confirmed"
            : state === "verifying"
              ? "Confirming payment"
              : "Payment failed"}
        </h1>

        <p className="mb-8 text-sm text-muted-foreground">
          {state === "paid"
            ? "Your payment is confirmed. The order can now move into preparation."
            : state === "verifying"
              ? "Paymob returned you to Cartura. We are waiting for the signed server callback before confirming payment."
              : "The payment was not completed. Review the order before trying another payment method."}
        </p>

        {orderNumber && (
          <div className="mb-8 rounded-lg bg-muted/50 py-3 text-sm">
            <span className="text-muted-foreground">Order number: </span>
            <span className="font-medium">{orderNumber}</span>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {orderId ? (
            <Button
              nativeButton={false}
              render={<Link href={`/settings/orders/${orderId}`} />}
              className="w-full"
            >
              View order details
            </Button>
          ) : (
            <Button
              nativeButton={false}
              render={<Link href="/settings/orders" />}
              className="w-full"
            >
              View my orders
            </Button>
          )}

          {state === "failed" && (
            <Button
              nativeButton={false}
              render={<Link href="/cart" />}
              variant="outline"
              className="w-full"
            >
              Return to cart
            </Button>
          )}
          
          {state === "paid" && (
            <Button
              nativeButton={false}
              render={<Link href="/products" />}
              variant="outline"
              className="w-full"
            >
              Continue shopping
            </Button>
          )}
          {state === "verifying" && (
            <Button
              nativeButton={false}
              render={<Link href={`/checkout/result?merchant_order_id=${encodeURIComponent(orderNumber ?? "")}`} />}
              variant="outline"
              className="w-full"
            >
              Check status again
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}

function getVerifiedPaymentState(
  order: Awaited<ReturnType<typeof listCustomerOrders>>["data"][number] | null,
) {
  if (order?.payment?.status === "paid") {
    return "paid" as const;
  }

  if (
    order?.payment?.status === "failed" ||
    order?.status === "payment_failed" ||
    order?.status === "cancelled"
  ) {
    return "failed" as const;
  }

  return "verifying" as const;
}

function CheckoutResultFallback() {
  return (
    <main className="flex min-h-[70dvh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md animate-pulse rounded-2xl border border-border bg-card p-8">
        <div className="mx-auto mb-6 size-18 rounded-full bg-muted" />
        <div className="mx-auto mb-3 h-7 w-52 rounded bg-muted" />
        <div className="mx-auto h-4 w-72 max-w-full rounded bg-muted" />
      </div>
    </main>
  );
}
