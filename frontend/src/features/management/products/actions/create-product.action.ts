"use server";

import {
  createProductRequestSchema,
  type CreateProductRequest,
} from "@cartura/contracts/catalog";
import { updateTag } from "next/cache";

import {
  managementActionFailure,
  type ManagementActionResult,
} from "@/features/management/shared/lib/action-result";

import {
  createManagementProduct,
  type ManagementProduct,
} from "../api/products-api";

export async function createProductAction(
  input: CreateProductRequest,
): Promise<ManagementActionResult<ManagementProduct>> {
  const parsed = createProductRequestSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Check the product details and try again." };
  }

  try {
    const product = await createManagementProduct(parsed.data);
    updateTag("catalog:products");

    return { ok: true, data: product };
  } catch (error) {
    return managementActionFailure(error);
  }
}
