import { Router } from "express";
import { mediaRateLimit } from "../../shared/middleware/rate-limit.js";

import { requireAuthentication } from "../auth/auth.middleware.js";
import { handleMediaImageUpload } from "./image-upload.middleware.js";
import { mediaController } from "./media.controller.js";
import {
  requireCategoryBannerManagement,
  requirePendingMediaDeletePermission,
  requireProductImageManagement,
} from "./media.middleware.js";

export const mediaRouter = Router();

mediaRouter.post(
  "/product-images",
  requireAuthentication,
  mediaRateLimit,
  requireProductImageManagement,
  handleMediaImageUpload,
  mediaController.uploadProductImages,
);

mediaRouter.post(
  "/category-banners",
  requireAuthentication,
  mediaRateLimit,
  requireCategoryBannerManagement,
  handleMediaImageUpload,
  mediaController.uploadCategoryBanner,
);

mediaRouter.delete(
  "/:mediaAssetId",
  requireAuthentication,
  mediaRateLimit,
  requirePendingMediaDeletePermission,
  mediaController.delete,
);
