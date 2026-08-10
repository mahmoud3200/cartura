import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import type {
  StorefrontCategory,
} from "../api/categories-api";
import type {
  StorefrontPagination,
  StorefrontProduct,
} from "../../products/api/products-api";
import { ProductCard } from "../../products/ui/product-card";
import { CatalogEmptyState } from "../../shared/ui/catalog-empty-state";
import { CatalogMedia } from "../../shared/ui/catalog-media";
import { ProductFilters } from "../../products/ui/product-filters";
import type { ProductFilterValues } from "../../products/lib/product-filters";
import { CatalogPagination } from "../../shared/ui/catalog-pagination";

type CategoryDetailPageProps = {
  category: StorefrontCategory;
  products: StorefrontProduct[];
  pagination?: StorefrontPagination;
  filters: ProductFilterValues;
};

export function CategoryDetailPage({
  category,
  products,
  pagination,
  filters,
}: CategoryDetailPageProps) {
  return (
    <main>
      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Categories
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <h1 className="text-balance text-5xl font-semibold tracking-[-0.05em] sm:text-7xl">
                {category.name}
              </h1>
              <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
                {category.description ??
                  "A focused category of active products from the Cartura catalog."}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/products"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition hover:bg-foreground/88 active:translate-y-px"
                >
                  Shop all
                </Link>
                <span className="text-sm text-muted-foreground">
                  {pagination?.totalItems ?? products.length} products
                </span>
              </div>
            </div>
            <CatalogMedia
              src={category.imageUrl}
              alt={category.name}
              priority
              className="aspect-[16/11]"
              sizes="(min-width: 1024px) 45vw, 100vw"
            />
          </div>
        </div>
      </section>

      {category.children && category.children.length > 0 ? (
        <section className="border-y border-border bg-card px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">
              Subcategories
            </h2>
            <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
              {category.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/categories/${child.slug}`}
                  className="shrink-0 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium transition hover:bg-muted active:translate-y-px"
                >
                  {child.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <ProductFilters
            key={JSON.stringify(filters)}
            filters={filters}
            action={`/categories/${category.slug}`}
          />
          <div className="mt-12 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.04em]">
                Products in {category.name}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Active items attached to this category.
              </p>
            </div>
            <Link href="/products" className="inline-flex items-center gap-2 text-sm font-medium">
              All products
              <ArrowRight className="size-4" />
            </Link>
          </div>

          {products.length > 0 ? (
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="mt-10">
              <CatalogEmptyState
                title="No products in this category yet"
                description="Products assigned to this active category will appear when the cached catalog is updated."
                href="/products"
                actionLabel="Browse all products"
              />
            </div>
          )}
          <CatalogPagination
            pagination={pagination}
            pathname={`/categories/${category.slug}`}
            params={{
              q: filters.q,
              minPrice: filters.minPrice,
              maxPrice: filters.maxPrice,
              inStock: filters.inStock,
            }}
          />
        </div>
      </section>
    </main>
  );
}
