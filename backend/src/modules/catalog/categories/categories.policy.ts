import { PERMISSIONS } from "../../authorization/index.js";

export const CATEGORY_ROUTE_PERMISSIONS = {
  create: PERMISSIONS.CATEGORIES_CREATE,
  update: PERMISSIONS.CATEGORIES_UPDATE,
  delete: PERMISSIONS.CATEGORIES_DELETE,
} as const;
