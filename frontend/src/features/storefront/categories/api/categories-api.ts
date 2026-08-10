import type {
  Category,
  ListCategoriesQuery,
} from "@cartura/contracts/catalog";
import {
  categoryListResponseSchema,
  categoryResponseSchema,
  listCategoriesQuerySchema,
} from "@cartura/contracts/catalog";
import { cacheLife, cacheTag } from "next/cache";

import {
  fetchCatalogJson,
  withSearchParams,
} from "../../shared/api/catalog-client";

export type StorefrontCategory = Category;
export type StorefrontCategoryListInput = Partial<ListCategoriesQuery>;

export async function listStorefrontCategories(
  input: StorefrontCategoryListInput = {},
) {
  "use cache";

  cacheLife("hours");
  cacheTag("catalog:categories");

  const query = listCategoriesQuerySchema.parse(input);
  const path = withSearchParams("/api/v1/catalog/categories", query);
  const payload = await fetchCatalogJson(path);

  return categoryListResponseSchema.parse(payload).data;
}

export async function getStorefrontCategoryBySlug(slug: string) {
  "use cache";

  cacheLife("hours");
  cacheTag("catalog:categories", `catalog:category:${slug}`);

  const payload = await fetchCatalogJson(
    `/api/v1/catalog/categories/${encodeURIComponent(slug)}`,
  );

  return categoryResponseSchema.parse(payload).data;
}
