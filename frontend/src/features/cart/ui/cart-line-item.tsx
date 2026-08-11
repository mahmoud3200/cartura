import type { CartItem } from "@cartura/contracts/cart";
import { Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/shared/ui/button";
import { CatalogMedia } from "@/shared/ui/catalog-media";

import { formatCartMoney } from "../lib/cart-formatters";

export function CartLineItem({
  item,
  isPending,
  onQuantityChange,
  onRemove,
}: {
  item: CartItem;
  isPending: boolean;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}) {
  return (
    <article className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-center sm:p-5">
      <Link href={`/products/${item.product.slug}`} className="block">
        <CatalogMedia
          src={item.product.image?.imageUrl}
          alt={item.product.image?.altText ?? item.product.name}
          className="aspect-square"
          sizes="112px"
        />
      </Link>

      <div className="min-w-0">
        <Link
          href={`/products/${item.product.slug}`}
          className="font-semibold hover:underline"
        >
          {item.product.name}
        </Link>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          {item.product.sku}
        </p>
        <p className="mt-3 font-mono text-sm">
          {formatCartMoney(item.unitPrice)} each
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
        <p className="font-mono font-semibold tabular-nums">
          {formatCartMoney(item.lineTotal)}
        </p>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={`Decrease ${item.product.name} quantity`}
            disabled={isPending}
            onClick={() => onQuantityChange(item.quantity - 1)}
          >
            <Minus />
          </Button>
          <span className="min-w-8 text-center font-mono text-sm tabular-nums">
            {item.quantity}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={`Increase ${item.product.name} quantity`}
            disabled={isPending || item.quantity >= item.product.stockQuantity}
            onClick={() => onQuantityChange(item.quantity + 1)}
          >
            <Plus />
          </Button>
          <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={`Remove ${item.product.name} from cart`}
            disabled={isPending}
            onClick={onRemove}
          >
            <Trash2 className="text-destructive" />
          </Button>
        </div>
      </div>
    </article>
  );
}
