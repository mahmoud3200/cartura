import "server-only";

import type {
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from "@cartura/contracts/catalog";
import { categorySchema } from "@cartura/contracts/catalog";
import { serverApiFetch } from "@/shared/api/server-api";
import {
  fetchManagementData,
  fetchManagementPaginated,
  type ManagementPaginationInput,
} from "@/features/management/shared/api/management-api";

export async function listManagementCategories(
  pagination: ManagementPaginationInput,
  query?: string,
) {
  return fetchManagementPaginated(
    "/api/v1/catalog/categories",
    categorySchema,
    pagination,
    { q: query },
  );
}

export async function getManagementCategoryBySlug(slug: string) {
  return fetchManagementData(
    `/api/v1/catalog/categories/${encodeURIComponent(slug)}`,
    categorySchema,
    { withAuth: false },
  );
}

export async function createManagementCategory(input: CreateCategoryRequest) {
  return fetchManagementData(
    "/api/v1/management/catalog/categories",
    categorySchema,
    {
      method: "POST",
      json: input,
    },
  );
}

export async function updateManagementCategory(input: {
  categoryId: string;
  category: UpdateCategoryRequest;
}) {
  return fetchManagementData(
    `/api/v1/management/catalog/categories/${input.categoryId}`,
    categorySchema,
    {
      method: "PATCH",
      json: input.category,
    },
  );
}

export async function deleteManagementCategory(categoryId: string) {
  await serverApiFetch<void>(
    `/api/v1/management/catalog/categories/${categoryId}`,
    {
      method: "DELETE",
      forwardCookies: true,
    },
  );
}
