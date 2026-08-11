import "server-only";

import { serverApiFetch } from "@/shared/api/server-api";

export async function deletePendingMediaAsset(mediaAssetId: string) {
  await serverApiFetch<void>(`/api/v1/management/media/${mediaAssetId}`, {
    method: "DELETE",
    forwardCookies: true,
  });
}
