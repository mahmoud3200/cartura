import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { StorefrontCategory } from "../api/categories-api";
import { CatalogEmptyState } from "../../shared/ui/catalog-empty-state";
import { CategoryCard } from "../ui/category-card";
import { CategoryFilters } from "../ui/category-filters";
import type { CategoryFilterValues } from "../lib/category-filters";

type CategoriesPageProps = {
  categories: StorefrontCategory[];
  filters: CategoryFilterValues;
  isUnavailable?: boolean;
};

export function CategoriesPage({
  categories,
  filters,
  isUnavailable = false,
}: CategoriesPageProps) {
  return (
    <main>
      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-4xl">
            <h1 className="text-balance text-5xl font-semibold tracking-tighter sm:text-7xl">
              Shop by category.
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
              Move through the catalog by room, ritual, trip, or use case.
            </p>
          </div>
          <div className="mt-10">
            <CategoryFilters
              key={`${filters.q ?? ""}:${filters.level}`}
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
                {filters.q ? `Matching “${filters.q}”` : "Current categories"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {categories.length > 0
                  ? `${categories.length} categories available`
                  : "Public category list"}
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-sm font-medium"
            >
              Shop products
              <ArrowRight className="size-4" />
            </Link>
          </div>

          {isUnavailable ? (
            <div className="mt-10">
              <CatalogEmptyState
                title="Categories are temporarily unavailable"
                description="The storefront will refresh from the API when the cached catalog is updated."
              />
            </div>
          ) : categories.length > 0 ? (
            <div className="mt-10 grid gap-3 lg:grid-cols-2">
              {categories.map((category, index) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="mt-10">
              <CatalogEmptyState
                title={filters.q ? "No matching categories" : "No categories are published yet"}
                description={filters.q ? "Try a broader search or clear the category filters." : "Create active categories with images in the dashboard to populate this page."}
                href="/products"
                actionLabel="View products"
              />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
