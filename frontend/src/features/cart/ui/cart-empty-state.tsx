import { ShoppingBag } from "lucide-react";
import Link from "next/link";

import { Button } from "@/shared/ui/button";

export function CartEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <ShoppingBag
        className="mx-auto size-10 text-muted-foreground"
        strokeWidth={1.5}
      />
      <h2 className="mt-5 text-xl font-semibold">Your cart is empty</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Browse the storefront and choose an item to begin your order.
      </p>
      <Button
        nativeButton={false}
        render={<Link href="/products" />}
        className="mt-6 h-10 px-5"
      >
        Browse products
      </Button>
    </div>
  );
}
