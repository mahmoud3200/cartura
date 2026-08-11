import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { StorefrontCategory } from "../api/categories-api";
import type {
  StorefrontPagination,
  StorefrontProduct,
} from "../../products/api/products-api";
import { ProductCard } from "../../products/ui/product-card";
import { CatalogEmptyState } from "../../shared/ui/catalog-empty-state";
import { ProductFilters } from "../../products/ui/product-filters";
import type { ProductFilterValues } from "../../products/lib/product-filters";
import { CatalogPagination } from "../../shared/ui/catalog-pagination";
import { CategoryDetailHero } from "../ui/category-detail-hero";

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
      <CategoryDetailHero
        category={category}
        productCount={pagination?.totalItems ?? products.length}
      />

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
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-sm font-medium"
            >
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
