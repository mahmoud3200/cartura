"use server";

import {
  createCategoryRequestSchema,
  type CreateCategoryRequest,
} from "@cartura/contracts/catalog";
import { updateTag } from "next/cache";

import {
  managementActionFailure,
  type ManagementActionResult,
} from "@/features/management/shared/lib/action-result";

import { createManagementCategory } from "../api/categories-api";
import type { ManagementCategory } from "../types";

export async function createCategoryAction(
  input: CreateCategoryRequest,
): Promise<ManagementActionResult<ManagementCategory>> {
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
