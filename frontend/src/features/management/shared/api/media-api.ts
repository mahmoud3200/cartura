import {
  mediaAssetListResponseSchema,
  type ImageEditSpec,
  type MediaAssetResponse,
} from "@cartura/contracts/media";

import { fetchInternalJson } from "./paginated-api";

export type ManagementMediaAsset = MediaAssetResponse;

export async function uploadProductImage({
  file,
  editSpec,
}: {
  file: File;
  editSpec: ImageEditSpec;
}) {
  const formData = new FormData();
  formData.append("files", file);
  formData.append("edits", JSON.stringify([editSpec]));

  const payload = await fetchInternalJson(
    "/api/management/media/product-images",
    {
      method: "POST",
      body: formData,
    },
  );

  return mediaAssetListResponseSchema.parse(payload).data[0] ?? null;
}

export async function uploadCategoryBanner({
  file,
  editSpec,
}: {
  file: File;
  editSpec: ImageEditSpec;
}) {
  const formData = new FormData();
  formData.append("files", file);
  formData.append("edits", JSON.stringify([editSpec]));

  const payload = await fetchInternalJson(
    "/api/management/media/category-banners",
    {
      method: "POST",
      body: formData,
    },
  );

  return mediaAssetListResponseSchema.parse(payload).data[0] ?? null;
}
