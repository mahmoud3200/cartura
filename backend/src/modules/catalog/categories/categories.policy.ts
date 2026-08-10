import { PERMISSIONS } from "../../authorization/authorization.constants.js";

export const CATEGORY_ROUTE_PERMISSIONS = {
  create: PERMISSIONS.CATEGORIES_CREATE,
  update: PERMISSIONS.CATEGORIES_UPDATE,
  delete: PERMISSIONS.CATEGORIES_DELETE,
} as const;

type CategoryVisibilityFields = {
  isDeleted: boolean;
  imageAssetId: string | null;
  imageUrl: string | null;
};

export function isCategoryApiVisible<T extends CategoryVisibilityFields>(
  category: T | null | undefined,
): category is T & { imageAssetId: string; imageUrl: string } {
  return Boolean(
    category &&
      !category.isDeleted &&
      category.imageAssetId &&
      category.imageUrl,
  );
}
