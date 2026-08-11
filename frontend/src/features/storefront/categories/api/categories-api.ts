import type { ListCategoriesQuery } from "@cartura/contracts/catalog";
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

export async function listStorefrontCategories(
  input: Partial<ListCategoriesQuery> = {},
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
