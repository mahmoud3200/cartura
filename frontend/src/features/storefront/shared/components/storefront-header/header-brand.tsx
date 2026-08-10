import { ShoppingBag } from "lucide-react";
import Link from "next/link";

export function StorefrontHeaderBrand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 text-sm font-semibold">
      <span className="grid size-8 place-items-center rounded-md bg-foreground text-background">
        <ShoppingBag className="size-4" />
      </span>
      <span className="tracking-[-0.01em]">Cartura</span>
    </Link>
  );
}
