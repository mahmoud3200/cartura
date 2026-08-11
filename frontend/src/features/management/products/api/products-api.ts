import "server-only";

import type {
  CreateProductRequest,
  ListProductsQuery,
  UpdateProductRequest,
} from "@cartura/contracts/catalog";
import { productSchema } from "@cartura/contracts/catalog";

import {
  fetchManagementData,
  fetchManagementPaginated,
  type ManagementPaginationInput,
} from "@/features/management/shared/api/management-api";
export async function listManagementProducts(
  input: ManagementPaginationInput &
    Pick<ListProductsQuery, "q" | "inStock">,
) {
  return fetchManagementPaginated(
    "/api/v1/catalog/products",
    productSchema,
    input,
    {
      q: input.q,
      inStock:
        input.inStock === undefined ? undefined : String(input.inStock),
    },
  );
}

export async function getManagementProductBySlug(slug: string) {
  return fetchManagementData(
    `/api/v1/catalog/products/${encodeURIComponent(slug)}`,
    productSchema,
    { withAuth: false },
  );
}

export async function createManagementProduct(input: CreateProductRequest) {
  return fetchManagementData(
    "/api/v1/management/catalog/products",
    productSchema,
    { method: "POST", json: input },
  );
}

export async function updateManagementProduct(input: {
  productId: string;
  product: UpdateProductRequest;
}) {
  return fetchManagementData(
    `/api/v1/management/catalog/products/${input.productId}`,
    productSchema,
    {
      method: "PATCH",
      json: input.product,
    },
  );
}

export async function deleteManagementProduct(productId: string) {
  return fetchManagementData(
    `/api/v1/management/catalog/products/${productId}`,
    productSchema,
    {
      method: "DELETE",
    },
  );
}
