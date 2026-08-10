import Link from "next/link";

import type { StorefrontProduct } from "../api/products-api";
import { CatalogMedia } from "../../shared/ui/catalog-media";

type ProductCardProps = {
  product: StorefrontProduct;
  index?: number;
};

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const primaryImage = product.images[0];
  const category = product.categories[0]?.name ?? "Catalog";

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block overflow-hidden rounded-2xl border border-border bg-card transition duration-300 hover:-translate-y-1 hover:border-foreground/20 hover:shadow-[0_22px_60px_color-mix(in_oklch,var(--foreground)_9%,transparent)] active:translate-y-px"
    >
      <CatalogMedia
        src={primaryImage?.imageUrl}
        alt={primaryImage?.altText ?? product.name}
        fallbackIndex={index}
        className="aspect-[4/5] rounded-none"
      />
      <div className="p-4">
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>{category}</p>
          {product.stockQuantity === 0 ? (
            <p className="text-destructive">Out of stock</p>
          ) : null}
        </div>
        <div className="mt-2 flex items-start justify-between gap-4">
          <h3 className="font-semibold tracking-[-0.025em] transition group-hover:text-primary">
            {product.name}
          </h3>
          <p className="shrink-0 font-mono text-sm font-medium">
            {formatPrice(product.price)}
          </p>
        </div>
      </div>
    </Link>
  );
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
  }).format(price);
}
