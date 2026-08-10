import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import {
  listStorefrontCategories,
} from "@/features/storefront/categories/api/categories-api";
import { CategoriesPage } from "@/features/storefront/categories/components/categories-page";
import {
  filterCategoriesByLevel,
  parseCategoryFilters,
} from "@/features/storefront/categories/lib/category-filters";
import { CatalogPageSkeleton } from "@/features/storefront/shared/ui/catalog-page-skeleton";

type CategoriesRouteProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Categories | Cartura",
  description: "Browse active Cartura catalog categories.",
};

export default function CategoriesRoutePage({ searchParams }: CategoriesRouteProps) {
  return (
    <Suspense fallback={<CatalogPageSkeleton />}>
      <CategoriesRouteContent searchParams={searchParams} />
    </Suspense>
  );
}

async function CategoriesRouteContent({ searchParams }: CategoriesRouteProps) {
  await connection();
  const filters = parseCategoryFilters(await searchParams);
  const categoriesResult = await listStorefrontCategories({
    limit: 100,
    q: filters.q,
  })
    .then((categories) => ({ categories, isUnavailable: false }))
    .catch(() => ({ categories: [], isUnavailable: true }));
  const categories = filterCategoriesByLevel(
    categoriesResult.categories,
    filters.level,
  );

  return (
    <CategoriesPage
      categories={categories}
      filters={filters}
      isUnavailable={categoriesResult.isUnavailable}
    />
  );
}
