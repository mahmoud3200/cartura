import type { MediaAssetUsage } from "@cartura/contracts/media";

import {
  conflictError,
  notFoundError,
  validationError,
} from "../../shared/errors/index.js";
import {
  mediaRepository,
  type MediaRepository,
} from "./media.repository.js";
import type { AttachedResource, MediaAsset } from "./media.types.js";

export class MediaAttachmentService {
  constructor(
    private readonly repository: MediaRepository = mediaRepository,
  ) {}

  async assertAttachableAssets(
    mediaAssetIds: string[],
    usage: MediaAssetUsage,
    resource?: AttachedResource,
  ): Promise<MediaAsset[]> {
    if (mediaAssetIds.length === 0) return [];

    const uniqueIds = [...new Set(mediaAssetIds)];
    if (uniqueIds.length !== mediaAssetIds.length) {
      throw validationError({
        mediaAssetIds: ["Duplicate media assets are not allowed"],
      });
    }

    const assets = await this.repository.findByIds(uniqueIds);
    if (assets.length !== uniqueIds.length) {
      throw notFoundError(
        "MEDIA_ASSET_NOT_FOUND",
        "One or more media assets were not found",
      );
    }

    const now = new Date();
    for (const asset of assets) {
      if (asset.usage !== usage) {
        throw validationError({
          mediaAssetId: asset.id,
          message: `Media asset must be used as ${usage}`,
        });
      }
      if (
        asset.status === "pending" &&
        (!asset.pendingExpiresAt || asset.pendingExpiresAt <= now)
      ) {
        throw conflictError(
          "MEDIA_ASSET_EXPIRED",
          "Media asset is expired and must be uploaded again",
        );
      }
      if (asset.status === "attached" && !isAttachedTo(asset, resource)) {
        throw conflictError(
          "MEDIA_ASSET_ALREADY_ATTACHED",
          "Media asset is already attached to another resource",
        );
      }
      if (asset.status !== "pending" && asset.status !== "attached") {
        throw conflictError(
          "MEDIA_ASSET_DELETION_IN_PROGRESS",
          "Media asset deletion is already in progress",
        );
      }
    }

    return assets;
  }
}

function isAttachedTo(
  asset: MediaAsset,
  resource: AttachedResource | undefined,
): boolean {
  return Boolean(
    resource &&
      asset.attachedResourceType === resource.type &&
      asset.attachedResourceId === resource.id,
  );
}
