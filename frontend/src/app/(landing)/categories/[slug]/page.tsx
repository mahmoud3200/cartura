import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import {
  getStorefrontCategoryBySlug,
} from "@/features/storefront/categories/api/categories-api";
import {
  listStorefrontCategoryProducts,
} from "@/features/storefront/products/api/products-api";
import { StorefrontApiError } from "@/features/storefront/shared/api/catalog-client";
import { CategoryDetailPage } from "@/features/storefront/categories/components/category-detail-page";
import {
  parseProductFilters,
  toProductListInput,
} from "@/features/storefront/products/lib/product-filters";
import { CatalogPageSkeleton } from "@/features/storefront/shared/ui/catalog-page-skeleton";

type CategoryRouteContext = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(
  context: CategoryRouteContext,
): Promise<Metadata> {
  await connection();
  const { slug } = await context.params;
  const category = await getStorefrontCategoryBySlug(slug).catch(() => null);

  if (!category) {
    return {
      title: "Category | Cartura",
      description: "Browse a Cartura catalog category.",
    };
  }

  const description =
    category.description ??
    `Browse active products in the ${category.name} category.`;

  return {
    title: `${category.name} | Cartura`,
    description,
    openGraph: {
      title: category.name,
      description,
      images: [category.imageUrl ?? "/visuals/collection-home.svg"],
    },
  };
}

export default function CategoryRoutePage(context: CategoryRouteContext) {
  return (
    <Suspense fallback={<CatalogPageSkeleton />}>
      <CategoryRouteContent {...context} />
    </Suspense>
  );
}

async function CategoryRouteContent(context: CategoryRouteContext) {
  await connection();
  const { slug } = await context.params;
  const filters = parseProductFilters(await context.searchParams);
  const category = await getCategoryOrNotFound(slug);
  const productsResult = await listStorefrontCategoryProducts(
    category.slug,
    toProductListInput(filters, { limit: 24 }),
  ).catch(() => null);

  return (
    <CategoryDetailPage
      category={category}
      products={productsResult?.data ?? []}
      pagination={productsResult?.pagination}
      filters={filters}
    />
  );
}

async function getCategoryOrNotFound(slug: string) {
  try {
    return await getStorefrontCategoryBySlug(slug);
  } catch (error) {
    if (error instanceof StorefrontApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}
