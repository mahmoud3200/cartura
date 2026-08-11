"use server";

import {
  updateCategoryRequestSchema,
  type Category,
  type UpdateCategoryRequest,
} from "@cartura/contracts/catalog";
import { updateTag } from "next/cache";
import { z } from "zod";

import {
  managementActionFailure,
  type ManagementActionResult,
} from "@/features/management/shared/lib/action-result";

import { updateManagementCategory } from "../api/categories-api";

const updateCategoryActionSchema = z.object({
  categoryId: z.uuid(),
  category: updateCategoryRequestSchema,
});

type UpdateCategoryActionInput = {
  categoryId: string;
  category: UpdateCategoryRequest;
};

export async function updateCategoryAction(
  input: UpdateCategoryActionInput,
): Promise<ManagementActionResult<Category>> {
  const parsed = updateCategoryActionSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Check the category details and try again." };
  }

  try {
    const category = await updateManagementCategory(parsed.data);
    updateTag("catalog:categories");
    updateTag("catalog:products");

    return { ok: true, data: category };
  } catch (error) {
    return managementActionFailure(error);
  }
}
