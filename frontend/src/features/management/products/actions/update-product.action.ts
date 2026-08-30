"use server";

import {
  updateProductRequestSchema,
  type Product,
  type UpdateProductInventoryRequest,
  type UpdateProductRequest,
} from "@cartura/contracts/catalog";
import { updateProductInventoryRequestSchema } from "@cartura/contracts/catalog";
import { updateTag } from "next/cache";
import { z } from "zod";
import { enforceBffRateLimit } from "@/shared/rate-limit";

import {
  managementActionFailure,
  type ManagementActionResult,
} from "@/features/management/shared/lib/action-result";

import {
  updateManagementProduct,
  updateManagementProductInventory,
} from "../api/products-api";

type UpdateProductActionInput = {
  productId: string;
  product: UpdateProductRequest;
  inventory?: UpdateProductInventoryRequest;
};

const updateProductActionSchema = z
  .object({
    productId: z.uuid(),
    product: updateProductRequestSchema,
    inventory: updateProductInventoryRequestSchema.optional(),
  })
  .strict();

export async function updateProductAction(
  input: UpdateProductActionInput,
): Promise<ManagementActionResult<Product>> {
  const parsed = updateProductActionSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Check the product details and try again." };
  }

  try {
    await enforceBffRateLimit("mutation");
    let product = await updateManagementProduct({
      productId: parsed.data.productId,
      product: parsed.data.product,
    });

    if (parsed.data.inventory) {
      product = await updateManagementProductInventory({
        productId: parsed.data.productId,
        inventory: parsed.data.inventory,
      });
    }
    updateTag("catalog:products");

    return { ok: true, data: product };
  } catch (error) {
    return managementActionFailure(error);
  }
}
