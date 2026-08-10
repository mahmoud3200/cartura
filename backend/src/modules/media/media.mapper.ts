import type { MediaAsset } from "./media.types.js";

export function mapMediaAsset(asset: MediaAsset) {
  return {
    id: asset.id,
    provider: asset.provider,
    publicId: asset.publicId,
    secureUrl: asset.secureUrl,
    canonicalUrl: asset.canonicalUrl,
    usage: asset.usage,
    status: asset.status,
    mimeType: asset.mimeType,
    format: asset.format,
    bytes: asset.bytes,
    width: asset.width,
    height: asset.height,
    editSpec: asset.editSpec,
    variants: asset.variants,
    uploadedBy: asset.uploadedBy,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
    attachedAt: asset.attachedAt?.toISOString() ?? null,
  };
}
