import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import {
  listStorefrontProducts,
} from "@/features/storefront/products/api/products-api";
import { ProductsPage } from "@/features/storefront/products/components/products-page";
import {
  parseProductFilters,
  toProductListInput,
} from "@/features/storefront/products/lib/product-filters";
import { CatalogPageSkeleton } from "@/features/storefront/shared/ui/catalog-page-skeleton";

type ProductsRouteProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Products | Cartura",
  description: "Browse active products from the Cartura catalog.",
};

export default function ProductsRoutePage({ searchParams }: ProductsRouteProps) {
  return (
    <Suspense fallback={<CatalogPageSkeleton />}>
      <ProductsRouteContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ProductsRouteContent({ searchParams }: ProductsRouteProps) {
  await connection();
  const filters = parseProductFilters(await searchParams);
  const productsResult = await listStorefrontProducts(
    toProductListInput(filters, { limit: 24 }),
  ).catch(() => null);
  const products = productsResult?.data ?? [];
  const pagination = productsResult?.pagination;

  return (
    <ProductsPage
      products={products}
      pagination={pagination}
      filters={filters}
      isUnavailable={!productsResult}
    />
  );
}
