"use server";

import type { Product } from "@cartura/contracts/catalog";
import { updateTag } from "next/cache";
import { z } from "zod";

import {
  managementActionFailure,
  type ManagementActionResult,
} from "@/features/management/shared/lib/action-result";

import { deleteManagementProduct } from "../api/products-api";

export async function deleteProductAction(
  productId: string,
): Promise<ManagementActionResult<Product>> {
  const parsed = z.uuid().safeParse(productId);

  if (!parsed.success) {
    return { ok: false, message: "Choose a valid product and try again." };
  }

  try {
    const product = await deleteManagementProduct(parsed.data);
    updateTag("catalog:products");

    return { ok: true, data: product };
  } catch (error) {
    return managementActionFailure(error);
  }
}
