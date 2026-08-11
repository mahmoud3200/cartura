import type { MediaAssetResponse } from "@cartura/contracts/media";

export type PendingProductImage = {
  asset: MediaAssetResponse;
  previewUrl: string;
  altText?: string;
};
