import type { ProductImageInput } from "@cartura/contracts/catalog";

import type { Prisma } from "../../../generated/prisma/client.js";
import { mediaRepository } from "../../media/media.repository.js";
import { CatalogPersistenceConflictError } from "../catalog.persistence-errors.js";

export async function prepareProductImages(
  tx: Prisma.TransactionClient,
  images: ProductImageInput[],
) {
  const assets = await tx.mediaAsset.findMany({
    where: { id: { in: images.map((image) => image.mediaAssetId) } },
    select: { id: true, canonicalUrl: true },
  });
  if (assets.length !== new Set(images.map((image) => image.mediaAssetId)).size) {
    throw new CatalogPersistenceConflictError("media_attachment");
  }

  const assetMap = new Map(assets.map((asset) => [asset.id, asset]));
  return images.map((image) => {
    const asset = assetMap.get(image.mediaAssetId);
    if (!asset) {
      throw new CatalogPersistenceConflictError("media_attachment");
    }
    return {
      mediaAssetId: image.mediaAssetId,
      imageUrl: asset.canonicalUrl,
      altText: image.altText ?? null,
      displayOrder: image.displayOrder,
    };
  });
}

export async function replaceProductImages(
  tx: Prisma.TransactionClient,
  productId: string,
  images: ProductImageInput[],
): Promise<void> {
  const imageData = await prepareProductImages(tx, images);
  await tx.productImage.deleteMany({ where: { productId } });
  await tx.productImage.createMany({
    data: imageData.map((image) => ({ productId, ...image })),
  });
  await attachProductImages(tx, images, productId);
}

export async function attachProductImages(
  tx: Prisma.TransactionClient,
  images: ProductImageInput[],
  productId: string,
): Promise<void> {
  const mediaAssetIds = images.map((image) => image.mediaAssetId);
  const uniqueIds = [...new Set(mediaAssetIds)];
  const attachment = await mediaRepository.markAttached(tx, uniqueIds, {
    type: "product",
    id: productId,
  });
  if (attachment.count !== uniqueIds.length) {
    throw new CatalogPersistenceConflictError("media_attachment");
  }
}

export async function detachProductImages(
  tx: Prisma.TransactionClient,
  mediaAssetIds: string[],
  productId: string,
): Promise<void> {
  const uniqueIds = [...new Set(mediaAssetIds)];
  if (uniqueIds.length === 0) return;

  const detachment = await mediaRepository.markPending(tx, uniqueIds, {
    type: "product",
    id: productId,
  });
  if (detachment.count !== uniqueIds.length) {
    throw new CatalogPersistenceConflictError("media_attachment");
  }
}
