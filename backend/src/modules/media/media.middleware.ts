import type { RequestHandler } from "express";

import { requireAnyPermission } from "../authorization/authorization.middleware.js";
import { forbiddenError, notFoundError } from "../../shared/errors/index.js";
import { parseInput } from "../../shared/validation/parse-input.js";
import {
  categoryBannerManagementPermissions,
  getMediaManagementPermissions,
  productImageManagementPermissions,
} from "./media.permissions.js";
import { mediaRepository } from "./media.repository.js";
import { mediaAssetIdParamsSchema } from "./media.schemas.js";

export const requireProductImageManagement = requireAnyPermission(
  ...productImageManagementPermissions,
);

export const requireCategoryBannerManagement = requireAnyPermission(
  ...categoryBannerManagementPermissions,
);

export const requirePendingMediaDeletePermission: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { mediaAssetId } = parseInput(mediaAssetIdParamsSchema, req.params);
    const asset = await mediaRepository.findById(mediaAssetId);

    if (!asset) {
      next(notFoundError("MEDIA_ASSET_NOT_FOUND", "Media asset not found"));
      return;
    }

    const permissions = getMediaManagementPermissions(asset.usage);
    if (permissions.length === 0) {
      next(forbiddenError());
      return;
    }

    requireAnyPermission(...permissions)(req, res, next);
  } catch (error) {
    next(error);
  }
};
