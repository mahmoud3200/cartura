import { env } from "../../config/env.js";
import { conflictError, notFoundError } from "../../shared/errors/index.js";
import { throwMediaStorageError } from "./media.errors.js";
import {
  mediaRepository,
  type MediaRepository,
} from "./media.repository.js";
import {
  cloudinaryMediaStorage,
  type MediaStorage,
} from "./media-storage.js";

export class MediaDeletionService {
  constructor(
    private readonly repository: MediaRepository = mediaRepository,
    private readonly storage: MediaStorage = cloudinaryMediaStorage,
  ) {}

  async deletePending(mediaAssetId: string): Promise<void> {
    const claim = await this.repository.claimPendingById(mediaAssetId);
    if (claim.kind === "not_found") {
      throw notFoundError("MEDIA_ASSET_NOT_FOUND", "Media asset not found");
    }
    if (claim.kind === "not_pending") {
      throw conflictError(
        "MEDIA_ASSET_ALREADY_ATTACHED",
        "Only pending media assets can be deleted",
      );
    }

    const claimedAt = requireClaimTimestamp(claim.asset.deletionClaimedAt);
    try {
      await this.storage.deleteImage(claim.asset.publicId);
    } catch (error) {
      throwMediaStorageError(error);
    }
    const deletion = await this.repository.finalizeDeletion(
      mediaAssetId,
      claimedAt,
    );
    if (deletion.count !== 1) {
      throw new Error("Media deletion claim was lost before finalization");
    }
  }

  async cleanupExpiredPending(limit = 100) {
    const staleClaimBefore = new Date(
      Date.now() - env.MEDIA_DELETE_CLAIM_TTL_MINUTES * 60 * 1000,
    );
    const assets = await this.repository.claimExpiredPending(
      new Date(),
      staleClaimBefore,
      limit,
    );
    let deleted = 0;
    let failed = 0;

    for (const asset of assets) {
      let claimedAt: Date;
      try {
        claimedAt = requireClaimTimestamp(asset.deletionClaimedAt);
        await this.storage.deleteImage(asset.publicId);
        const deletion = await this.repository.finalizeDeletion(
          asset.id,
          claimedAt,
        );
        if (deletion.count === 1) {
          deleted += 1;
        } else {
          failed += 1;
        }
      } catch (error) {
        failed += 1;
        console.error("Failed to cleanup pending media asset", {
          mediaAssetId: asset.id,
          publicId: asset.publicId,
          error,
        });
      }
    }

    return { deleted, failed };
  }
}

function requireClaimTimestamp(value: Date | null): Date {
  if (!value) {
    throw new Error("Claimed media asset is missing its claim timestamp");
  }
  return value;
}
