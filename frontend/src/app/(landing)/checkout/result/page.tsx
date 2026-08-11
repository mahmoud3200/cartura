import { Suspense } from "react";

import {
  CheckoutResultPage,
  type CheckoutResultSearchParams,
} from "@/features/cart/components/checkout-result-page";
import { CheckoutResultSkeleton } from "@/features/cart/ui/checkout-result-skeleton";

export default function CheckoutResultRoute({
  searchParams,
}: {
  searchParams: CheckoutResultSearchParams;
}) {
  return (
    <Suspense fallback={<CheckoutResultSkeleton />}>
      <CheckoutResultPage searchParams={searchParams} />
    </Suspense>
  );
}
