import type { RequestHandler } from "express";
import type { MediaAssetUsage } from "@cartura/contracts/media";

import {
  PERMISSIONS,
  type PermissionName,
} from "../authorization/authorization.constants.js";
import { requireAnyPermission } from "../authorization/authorization.middleware.js";
import { forbiddenError, notFoundError } from "../../shared/errors/index.js";
import { getPathParam } from "../../shared/utils/request.utils.js";
import { mediaRepository } from "./media.repository.js";

const usagePermissionMap = {
  product_image: [PERMISSIONS.PRODUCTS_CREATE, PERMISSIONS.PRODUCTS_UPDATE],
  category_banner: [PERMISSIONS.CATEGORIES_CREATE, PERMISSIONS.CATEGORIES_UPDATE],
} satisfies Record<MediaAssetUsage, readonly PermissionName[]>;

export const requireProductImageManagement = requireAnyPermission(
  ...usagePermissionMap.product_image,
);

export const requireCategoryBannerManagement = requireAnyPermission(
  ...usagePermissionMap.category_banner,
);

export const requirePendingMediaDeletePermission: RequestHandler = async (
  req,
  _res,
  next,
) => {
  try {
    const mediaAssetId = getPathParam(req.params.mediaAssetId);
    const asset = await mediaRepository.findById(mediaAssetId);

    if (!asset) {
      next(notFoundError("MEDIA_ASSET_NOT_FOUND", "Media asset not found"));
      return;
    }

    const permissions =
      usagePermissionMap[asset.usage as MediaAssetUsage] ?? [];

    if (permissions.length === 0) {
      next(forbiddenError());
      return;
    }

    requireAnyPermission(...permissions)(req, _res, next);
  } catch (error) {
    next(error);
  }
};
