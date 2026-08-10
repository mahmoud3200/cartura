"use server";

import { z } from "zod";

import { deletePendingMediaAsset } from "@/features/management/shared/api/media-server-api";
import {
  managementActionFailure,
  type ManagementActionResult,
} from "@/features/management/shared/lib/action-result";

export async function deleteCategoryMediaAction(
  mediaAssetId: string,
): Promise<ManagementActionResult<null>> {
  const parsed = z.uuid().safeParse(mediaAssetId);

  if (!parsed.success) {
    return { ok: false, message: "Choose a valid category image." };
  }

  try {
    await deletePendingMediaAsset(parsed.data);
    return { ok: true, data: null };
  } catch (error) {
    return managementActionFailure(error);
  }
}
