import { CheckCircle2, Clock, XCircle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/shared/ui/button";

import type { CheckoutPaymentState } from "../lib/checkout-result";

const resultContent = {
  paid: {
    title: "Payment confirmed",
    description:
      "Your payment is confirmed. The order can now move into preparation.",
    icon: CheckCircle2,
    iconClass:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-500",
  },
  verifying: {
    title: "Confirming payment",
    description:
      "Paymob returned you to Cartura. We are waiting for the signed server callback before confirming payment.",
    icon: Clock,
    iconClass:
      "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-500",
  },
  failed: {
    title: "Payment failed",
    description:
      "The payment was not completed. Review the order before trying another payment method.",
    icon: XCircle,
    iconClass:
      "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-500",
  },
} satisfies Record<
  CheckoutPaymentState,
  {
    title: string;
    description: string;
    icon: typeof CheckCircle2;
    iconClass: string;
  }
>;

export function CheckoutResultCard({
  state,
  orderId,
  orderNumber,
}: {
  state: CheckoutPaymentState;
  orderId: string | null;
  orderNumber: string | null;
}) {
  const content = resultContent[state];
  const Icon = content.icon;

  return (
    <main className="flex min-h-[70dvh] flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mb-6 flex justify-center">
          <div className={`rounded-full p-3 ${content.iconClass}`}>
            <Icon className="size-12" strokeWidth={1.5} />
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold tracking-tight">
          {content.title}
        </h1>
        <p className="mb-8 text-sm text-muted-foreground">
          {content.description}
        </p>

        {orderNumber ? (
          <div className="mb-8 rounded-lg bg-muted/50 py-3 text-sm">
            <span className="text-muted-foreground">Order number: </span>
            <span className="font-medium">{orderNumber}</span>
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          <Button
            nativeButton={false}
            render={
              <Link
                href={
                  orderId ? `/settings/orders/${orderId}` : "/settings/orders"
                }
              />
            }
            className="w-full"
          >
            {orderId ? "View order details" : "View my orders"}
          </Button>
          <CheckoutResultSecondaryAction
            state={state}
            orderNumber={orderNumber}
          />
        </div>
      </div>
    </main>
  );
}

function CheckoutResultSecondaryAction({
  state,
  orderNumber,
}: {
  state: CheckoutPaymentState;
  orderNumber: string | null;
}) {
  const href =
    state === "failed"
      ? "/cart"
      : state === "paid"
        ? "/products"
        : `/checkout/result?merchant_order_id=${encodeURIComponent(orderNumber ?? "")}`;
  const label =
    state === "failed"
      ? "Return to cart"
      : state === "paid"
        ? "Continue shopping"
        : "Check status again";

  return (
    <Button
      nativeButton={false}
      render={<Link href={href} />}
      variant="outline"
      className="w-full"
    >
      {label}
    </Button>
  );
}
