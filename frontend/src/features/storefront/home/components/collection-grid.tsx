import type { Category } from "@cartura/contracts/catalog";
import type { CSSProperties } from "react";
import Link from "next/link";
import { cacheLife, cacheTag } from "next/cache";

import { listStorefrontCategories } from "../../categories/api/categories-api";
import { CategoryBanner } from "../../categories/ui/category-banner";
import { CatalogEmptyState } from "../../shared/ui/catalog-empty-state";
import { ArrowRight } from "lucide-react";
import { getCollectionGridLayout } from "../lib/collection-grid-layout";

type CollectionGridProps = {
  categories: Category[];
  isUnavailable?: boolean;
};

export async function CachedCollectionGrid() {
  "use cache";

  cacheLife("hours");
  cacheTag("catalog:categories", "storefront:home:categories");

  const categoriesResult = await listStorefrontCategories()
    .then((categories) => ({ categories, isUnavailable: false }))
    .catch(() => ({ categories: [], isUnavailable: true }));

  return (
    <CollectionGrid
      categories={categoriesResult.categories}
      isUnavailable={categoriesResult.isUnavailable}
    />
  );
}

export function CollectionGrid({
  categories,
  isUnavailable = false,
}: CollectionGridProps) {
  const featuredCategories = categories.slice(0, 4);
  const { categoryLayouts, gridLayout, showMoreLayout } =
    getCollectionGridLayout(featuredCategories.length);

  return (
    <section id="collections" className="px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <h2 className="text-balance text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
            Shop by category.
          </h2>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            Find everyday clothing, layering pieces, and accessories in the
            collections that fit your style.
          </p>
        </div>

        {isUnavailable ? (
          <div className="mt-12">
            <CatalogEmptyState
              title="Categories are temporarily unavailable"
              description="The storefront will refresh from the API when the cached catalog is updated."
            />
          </div>
        ) : featuredCategories.length > 0 ? (
          <div
            className={`mt-12 grid grid-flow-dense gap-3 ${gridLayout}`}
          >
            {featuredCategories.map((category, index) => (
              <div
                key={category.id}
                className={`reveal ${categoryLayouts[index] ?? "lg:col-span-6"}`}
                style={{ "--index": index } as CSSProperties}
              >
                <CategoryBanner
                  category={category}
                  index={index}
                  className="h-full lg:min-h-0"
                />
              </div>
            ))}
            <Link
              href="/categories"
              className={`reveal group flex min-h-48 flex-col justify-between rounded-2xl border border-border bg-primary p-6 text-primary-foreground transition duration-300 hover:-translate-y-1 hover:bg-primary/88 active:translate-y-px lg:min-h-0 ${showMoreLayout}`}
              style={{ "--index": featuredCategories.length } as CSSProperties}
            >
              <span className="text-sm text-primary-foreground/70">
                {categories.length} categories
              </span>
              <span className="flex items-end justify-between gap-4 text-2xl font-semibold tracking-[-0.04em]">
                Show more
                <ArrowRight className="size-5 transition group-hover:translate-x-1" />
              </span>
            </Link>
          </div>
        ) : (
          <div className="mt-12">
            <CatalogEmptyState
              title="No categories are published yet"
              description="Active categories from the API will appear here when the cached catalog is updated."
              href="/products"
              actionLabel="View products"
            />
          </div>
        )}

      </div>
    </section>
  );
}
