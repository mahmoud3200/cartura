import { Router } from "express";

import { requireAuthentication } from "../auth/auth.middleware.js";
import { handleMediaImageUpload } from "./image-upload.middleware.js";
import { mediaController } from "./media.controller.js";
import {
  requireCategoryBannerManagement,
  requirePendingMediaDeletePermission,
  requireProductImageManagement,
} from "./media.policy.js";

export const mediaRouter = Router();

mediaRouter.post(
  "/product-images",
  requireAuthentication,
  requireProductImageManagement,
  handleMediaImageUpload,
  mediaController.uploadProductImages,
);

mediaRouter.post(
  "/category-banners",
  requireAuthentication,
  requireCategoryBannerManagement,
  handleMediaImageUpload,
  mediaController.uploadCategoryBanner,
);

mediaRouter.delete(
  "/:mediaAssetId",
  requireAuthentication,
  requirePendingMediaDeletePermission,
  mediaController.delete,
);
