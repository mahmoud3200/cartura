"use server";

import { updateTag } from "next/cache";
import { z } from "zod";

import {
  managementActionFailure,
  type ManagementActionResult,
} from "@/features/management/shared/lib/action-result";

import { deleteManagementCategory } from "../api/categories-api";

export async function deleteCategoryAction(
  categoryId: string,
): Promise<ManagementActionResult<void>> {
  const parsed = z.uuid().safeParse(categoryId);

  if (!parsed.success) {
    return { ok: false, message: "Choose a valid category and try again." };
  }

  try {
    await deleteManagementCategory(parsed.data);
    updateTag("catalog:categories");
    updateTag("catalog:products");

    return { ok: true, data: undefined };
  } catch (error) {
    return managementActionFailure(error);
  }
}
