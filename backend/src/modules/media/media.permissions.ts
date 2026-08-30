import type { MediaAssetUsage } from "@cartura/contracts/media";

import {
  PERMISSIONS,
  type PermissionName,
} from "../authorization/authorization.constants.js";

const usagePermissionMap = {
  product_image: [PERMISSIONS.PRODUCTS_CREATE, PERMISSIONS.PRODUCTS_UPDATE],
  category_banner: [PERMISSIONS.CATEGORIES_CREATE, PERMISSIONS.CATEGORIES_UPDATE],
} satisfies Record<MediaAssetUsage, readonly PermissionName[]>;

export function getMediaManagementPermissions(
  usage: string,
): readonly PermissionName[] {
  return usage === "product_image" || usage === "category_banner"
    ? usagePermissionMap[usage]
    : [];
}

export const productImageManagementPermissions =
  usagePermissionMap.product_image;
export const categoryBannerManagementPermissions =
  usagePermissionMap.category_banner;
