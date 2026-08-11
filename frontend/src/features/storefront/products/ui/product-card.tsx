import type { Product } from "@cartura/contracts/catalog";
import Link from "next/link";
import { CatalogMedia } from "@/shared/ui/catalog-media";

type ProductCardProps = {
  product: Product;
  index?: number;
};

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const primaryImage = product.images[0];

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-[transform,border-color,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:border-foreground/20 hover:shadow-[0_22px_60px_color-mix(in_oklch,var(--foreground)_9%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px"
    >
      <CatalogMedia
        src={primaryImage?.imageUrl}
        alt={primaryImage?.altText ?? product.name}
        fallbackIndex={index}
        className="aspect-square rounded-none"
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
      />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <h3 className="line-clamp-2 min-w-0 text-lg font-semibold leading-tight tracking-tight transition-colors group-hover:text-primary">
            {product.name}
          </h3>
          <div className="shrink-0 text-right">
            <p className="font-mono text-sm font-medium tabular-nums">
              {formatPrice(product.price)}
            </p>
            {product.stockQuantity === 0 ? (
              <p className="mt-1 text-[11px] font-medium text-destructive">
                Out of stock
              </p>
            ) : null}
          </div>
        </div>

        <ul
          aria-label="Product categories"
          className="mt-auto flex flex-wrap gap-1.5 pt-5"
        >
          {product.categories.length > 0 ? (
            product.categories.map((category) => (
              <li
                key={category.id}
                className="rounded-md border border-foreground/10 bg-muted px-2.5 py-1.5 text-xs font-medium leading-none text-muted-foreground"
              >
                {category.name}
              </li>
            ))
          ) : (
            <li className="rounded-md border border-foreground/10 bg-muted px-2.5 py-1.5 text-xs font-medium leading-none text-muted-foreground">
              Catalog
            </li>
          )}
        </ul>
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
