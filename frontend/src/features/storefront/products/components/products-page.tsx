import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type {
  StorefrontPagination,
  StorefrontProduct,
} from "../api/products-api";
import { ProductCard } from "../ui/product-card";
import { ProductFilters } from "../ui/product-filters";
import type { ProductFilterValues } from "../lib/product-filters";
import { CatalogEmptyState } from "../../shared/ui/catalog-empty-state";
import { CatalogPagination } from "../../shared/ui/catalog-pagination";

type ProductsPageProps = {
  products: StorefrontProduct[];
  pagination?: StorefrontPagination;
  filters: ProductFilterValues;
  isUnavailable?: boolean;
};

export function ProductsPage({
  products,
  pagination,
  filters,
  isUnavailable = false,
}: ProductsPageProps) {
  return (
    <main>
      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-4xl">
            <h1 className="text-balance text-5xl font-semibold tracking-[-0.05em] sm:text-7xl">
              Products for the everyday edit.
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
              Browse active products, new arrivals, and category-led pieces from the Cartura catalog.
            </p>
          </div>

          <div className="mt-10">
            <ProductFilters
              key={JSON.stringify(filters)}
              filters={filters}
            />
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.04em]">
                {filters.q ? `Results for “${filters.q}”` : "All products"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {pagination
                  ? `${pagination.totalItems} products available`
                  : "Current public catalog"}
              </p>
            </div>
            <Link href="/categories" className="inline-flex items-center gap-2 text-sm font-medium">
              Browse categories
              <ArrowRight className="size-4" />
            </Link>
          </div>

          {isUnavailable ? (
            <div className="mt-10">
              <CatalogEmptyState
                title="Catalog is temporarily unavailable"
                description="The storefront will refresh from the API when the cached catalog is updated."
              />
            </div>
          ) : products.length > 0 ? (
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="mt-10">
              <CatalogEmptyState
                title="No products are published yet"
                description="Published products with at least one image will appear here when the cached catalog is updated."
                href="/categories"
                actionLabel="View categories"
              />
            </div>
          )}
          <CatalogPagination
            pagination={pagination}
            pathname="/products"
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
