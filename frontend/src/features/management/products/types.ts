import type { ManagementMediaAsset } from "@/features/management/shared/api/media-api";

export type PendingProductImage = {
  asset: ManagementMediaAsset;
  previewUrl: string;
  altText?: string;
};
