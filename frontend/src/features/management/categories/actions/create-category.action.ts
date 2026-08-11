"use server";

import {
  createCategoryRequestSchema,
  type Category,
  type CreateCategoryRequest,
} from "@cartura/contracts/catalog";
import { updateTag } from "next/cache";

import {
  managementActionFailure,
  type ManagementActionResult,
} from "@/features/management/shared/lib/action-result";

import { createManagementCategory } from "../api/categories-api";

export async function createCategoryAction(
  input: CreateCategoryRequest,
): Promise<ManagementActionResult<Category>> {
  const parsed = createCategoryRequestSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Check the category details and try again." };
  }

  try {
    const category = await createManagementCategory(parsed.data);
    updateTag("catalog:categories");
    updateTag("catalog:products");

    return { ok: true, data: category };
  } catch (error) {
    return managementActionFailure(error);
  }
}
