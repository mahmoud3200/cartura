import type { ListProductsQuery } from "@cartura/contracts/catalog";
import {
  listProductsQuerySchema,
  productListResponseSchema,
  productResponseSchema,
} from "@cartura/contracts/catalog";
import { cacheLife, cacheTag } from "next/cache";

import {
  fetchCatalogJson,
  withSearchParams,
} from "../../shared/api/catalog-client";

export async function listStorefrontProducts(
  input: Partial<ListProductsQuery> = {},
) {
  "use cache";

  cacheLife("hours");
  cacheTag("catalog:products");

  const query = listProductsQuerySchema.parse(input);
  const path = withSearchParams("/api/v1/catalog/products", query);
  const payload = await fetchCatalogJson(path);

  return productListResponseSchema.parse(payload);
}

export async function listStorefrontCategoryProducts(
  categorySlug: string,
  input: Partial<ListProductsQuery> = {},
) {
  "use cache";

  cacheLife("hours");
  cacheTag("catalog:products", `catalog:category:${categorySlug}:products`);

  const query = listProductsQuerySchema.parse(input);
  const path = withSearchParams(
    `/api/v1/catalog/categories/${encodeURIComponent(categorySlug)}/products`,
    query,
  );
  const payload = await fetchCatalogJson(path);

  return productListResponseSchema.parse(payload);
}

export async function getStorefrontProductBySlug(slug: string) {
  "use cache";

  cacheLife("hours");
  cacheTag("catalog:products", `catalog:product:${slug}`);

  const payload = await fetchCatalogJson(
    `/api/v1/catalog/products/${encodeURIComponent(slug)}`,
  );

  return productResponseSchema.parse(payload).data;
}
