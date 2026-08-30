import type { RequestHandler } from "express";
import {
  type ImageEditSpec,
  type MediaAssetUsage,
} from "@cartura/contracts/media";

import { validationError } from "../../shared/errors/index.js";
import { getAuthenticatedUserId } from "../../shared/utils/request.utils.js";
import { parseInput } from "../../shared/validation/parse-input.js";
import { mapMediaAsset } from "./media.mapper.js";
import {
  imageEditSpecsSchema,
  mediaAssetIdParamsSchema,
} from "./media.schemas.js";
import { mediaService } from "./media.service.js";

export class MediaController {
  uploadProductImages = this.createUploadHandler("product_image");
  uploadCategoryBanner = this.createUploadHandler("category_banner");

  private createUploadHandler(usage: MediaAssetUsage): RequestHandler {
    return async (req, res, next) => {
      try {
        const files = Array.isArray(req.files)
          ? req.files
          : Object.values(req.files ?? {}).flat();
        const assets = await mediaService.uploadImages(
          files,
          usage,
          getImageEdits(req.body?.edits, files.length),
          getAuthenticatedUserId(req),
        );

        res.status(201).json({ data: assets.map(mapMediaAsset) });
      } catch (error) {
        next(error);
      }
    };
  }

  delete: RequestHandler = async (req, res, next) => {
    try {
      const { mediaAssetId } = parseInput(mediaAssetIdParamsSchema, req.params);
      await mediaService.deletePending(mediaAssetId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}

function getImageEdits(value: unknown, fileCount: number): ImageEditSpec[] {
  if (typeof value !== "string") {
    throw validationError({ edits: ["Image edit instructions are required"] });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw validationError({
      edits: ["Image edit instructions must be valid JSON"],
    });
  }

  const result = imageEditSpecsSchema.safeParse(parsed);
  if (!result.success) {
    throw validationError({ edits: result.error.flatten() });
  }

  if (result.data.length !== fileCount) {
    throw validationError({
      edits: ["Every uploaded image must have one edit instruction"],
    });
  }

  return result.data;
}

export const mediaController = new MediaController();
