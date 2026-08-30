import { MAX_PRODUCT_IMAGES } from "@cartura/contracts/catalog";
import type { ImageEditSpec, MediaAssetUsage } from "@cartura/contracts/media";
import { fileTypeFromBuffer } from "file-type";
import sharp, { type Metadata } from "sharp";

import { httpError, validationError } from "../../shared/errors/index.js";
import { assertImageEditIsUsable } from "./media-image-rules.js";
import { throwMediaStorageError } from "./media.errors.js";
import {
  mediaRepository,
  type CreateMediaAssetInput,
  type MediaRepository,
} from "./media.repository.js";
import {
  cloudinaryMediaStorage,
  type MediaStorage,
} from "./media-storage.js";

const allowedMimeTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const minimumSourceDimension = 64;
const maximumInputPixels = 40_000_000;

export class MediaUploadService {
  constructor(
    private readonly repository: MediaRepository = mediaRepository,
    private readonly storage: MediaStorage = cloudinaryMediaStorage,
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
        const uploadedImage = await this.storage.uploadImageBuffer(
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
        uploaded.map((image) => this.storage.deleteImage(image.publicId)),
      );
      throwMediaStorageError(error);
    }
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
    if (usage === "product_image" && files.length > MAX_PRODUCT_IMAGES) {
      throw validationError({
        files: [
          `Product image upload accepts at most ${MAX_PRODUCT_IMAGES} images`,
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
