import { fileTypeFromBuffer } from "file-type";
import sharp, { type Metadata } from "sharp";
import type { ImageEditSpec, MediaAssetUsage } from "@cartura/contracts/media";

import { env } from "../../config/env.js";
import {
  deleteImage,
  uploadImageBuffer,
} from "../../infrastructure/storage/cloudinary-storage.js";
import {
  conflictError,
  httpError,
  notFoundError,
  validationError,
} from "../../shared/errors/index.js";
import {
  mediaRepository,
  type CreateMediaAssetInput,
  type MediaRepository,
} from "./media.repository.js";
import type { AttachedResource, MediaAsset } from "./media.types.js";
import { assertImageEditIsUsable } from "./media-image-rules.js";

const allowedMimeTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const maxProductImages = 10;
const minimumSourceDimension = 64;
const maximumInputPixels = 40_000_000;

export class MediaService {
  constructor(
    private readonly repository: MediaRepository = mediaRepository,
  ) {}

  async uploadImages(
    files: Express.Multer.File[],
    usage: MediaAssetUsage,
    edits: ImageEditSpec[],
    uploadedBy?: string,
  ) {
    this.assertFileCount(files, usage);
    if (files.length !== edits.length) {
      throw validationError({
        edits: ["Every uploaded image must have one edit instruction"],
      });
    }

    const inspectedFiles = await Promise.all(
      files.map(async (file, index) => {
        const image = await this.inspectImage(file);
        assertImageEditIsUsable({
          image,
          edit: edits[index]!,
          usage,
          fileName: file.originalname,
        });
        return { file, image, editSpec: edits[index]! };
      }),
    );

    const uploaded: CreateMediaAssetInput[] = [];

    try {
      for (const { file, image, editSpec } of inspectedFiles) {
        const uploadedImage = await uploadImageBuffer(
          file.buffer,
          usage,
          editSpec,
          { width: image.width, height: image.height },
        );

        uploaded.push({
          ...uploadedImage,
          usage,
          mimeType: image.mimeType,
          editSpec,
          uploadedBy,
        });
      }

      return await this.repository.createMany(uploaded);
    } catch (error) {
      await Promise.allSettled(
        uploaded.map((image) => deleteImage(image.publicId)),
      );

      throw error;
    }
  }

  async deletePending(mediaAssetId: string) {
    const asset = await this.repository.findById(mediaAssetId);

    if (!asset) {
      throw notFoundError("MEDIA_ASSET_NOT_FOUND", "Media asset not found");
    }

    if (asset.status !== "pending") {
      throw conflictError(
        "MEDIA_ASSET_ALREADY_ATTACHED",
        "Only pending media assets can be deleted",
      );
    }

    await deleteImage(asset.publicId);
    await this.repository.deleteById(mediaAssetId);
  }

  async cleanupExpiredPending(limit = 100) {
    const cutoff = new Date(
      Date.now() - env.MEDIA_PENDING_TTL_HOURS * 60 * 60 * 1000,
    );
    const assets = await this.repository.findExpiredPending(cutoff, limit);
    let deleted = 0;
    let failed = 0;

    for (const asset of assets) {
      try {
        await deleteImage(asset.publicId);
        await this.repository.deleteById(asset.id);
        deleted += 1;
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

  async assertAttachableAssets(
    mediaAssetIds: string[],
    usage: MediaAssetUsage,
    resource?: AttachedResource,
  ): Promise<MediaAsset[]> {
    if (mediaAssetIds.length === 0) {
      return [];
    }

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

    const expiresBefore = new Date(
      Date.now() - env.MEDIA_PENDING_TTL_HOURS * 60 * 60 * 1000,
    );

    for (const asset of assets) {
      if (asset.usage !== usage) {
        throw validationError({
          mediaAssetId: asset.id,
          message: `Media asset must be used as ${usage}`,
        });
      }

      if (asset.status === "pending" && asset.createdAt < expiresBefore) {
        throw conflictError(
          "MEDIA_ASSET_EXPIRED",
          "Media asset is expired and must be uploaded again",
        );
      }

      if (asset.status === "attached") {
        const attachedToSameResource =
          resource &&
          asset.attachedResourceType === resource.type &&
          asset.attachedResourceId === resource.id;

        if (!attachedToSameResource) {
          throw conflictError(
            "MEDIA_ASSET_ALREADY_ATTACHED",
            "Media asset is already attached to another resource",
          );
        }
      }
    }

    return assets;
  }

  private assertFileCount(
    files: Express.Multer.File[],
    usage: MediaAssetUsage,
  ): void {
    if (files.length === 0) {
      throw validationError({ files: ["At least one image is required"] });
    }

    if (usage === "category_banner" && files.length !== 1) {
      throw validationError({
        files: ["Category banner upload accepts exactly one image"],
      });
    }

    if (usage === "product_image" && files.length > maxProductImages) {
      throw validationError({
        files: [
          `Product image upload accepts at most ${maxProductImages} images`,
        ],
      });
    }
  }

  private async inspectImage(file: Express.Multer.File): Promise<{
    mimeType: string;
    width: number;
    height: number;
  }> {
    const detected = await fileTypeFromBuffer(file.buffer);

    if (!detected || !allowedMimeTypes.has(detected.mime)) {
      throw validationError({
        file: file.originalname,
        allowedTypes: [...allowedMimeTypes],
      });
    }

    let metadata: Metadata;
    try {
      metadata = await sharp(file.buffer, {
        failOn: "error",
        limitInputPixels: maximumInputPixels,
      }).metadata();
    } catch {
      throw validationError({
        file: file.originalname,
        message: "The selected file is not a valid or safely sized image",
      });
    }

    if (!metadata.width || !metadata.height) {
      throw validationError({
        file: file.originalname,
        message: "Image dimensions could not be read",
      });
    }

    const swapsAxes =
      metadata.orientation !== undefined &&
      metadata.orientation >= 5 &&
      metadata.orientation <= 8;
    const width = swapsAxes ? metadata.height : metadata.width;
    const height = swapsAxes ? metadata.width : metadata.height;

    if (width < minimumSourceDimension || height < minimumSourceDimension) {
      throw httpError(
        400,
        "IMAGE_DIMENSIONS_INVALID",
        `Images must be at least ${minimumSourceDimension}x${minimumSourceDimension}`,
        { file: file.originalname, width, height },
      );
    }

    return { mimeType: detected.mime, width, height };
  }

}

export const mediaService = new MediaService();
