"use server";

import {
  updateProductRequestSchema,
  type Product,
  type UpdateProductRequest,
} from "@cartura/contracts/catalog";
import { updateTag } from "next/cache";
import { z } from "zod";

import {
  managementActionFailure,
  type ManagementActionResult,
} from "@/features/management/shared/lib/action-result";

import { updateManagementProduct } from "../api/products-api";

type UpdateProductActionInput = {
  productId: string;
  product: UpdateProductRequest;
};

const updateProductActionSchema = z.object({
  productId: z.uuid(),
  product: updateProductRequestSchema,
});

export async function updateProductAction(
  input: UpdateProductActionInput,
): Promise<ManagementActionResult<Product>> {
  const parsed = updateProductActionSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Check the product details and try again." };
  }

  try {
    const product = await updateManagementProduct(parsed.data);
    updateTag("catalog:products");

    return { ok: true, data: product };
  } catch (error) {
    return managementActionFailure(error);
  }
}
