import { PERMISSIONS } from "../../authorization/index.js";

export const PRODUCT_ROUTE_PERMISSIONS = {
  create: PERMISSIONS.PRODUCTS_CREATE,
  update: PERMISSIONS.PRODUCTS_UPDATE,
  delete: PERMISSIONS.PRODUCTS_DELETE,
  updateInventory: PERMISSIONS.INVENTORY_UPDATE,
} as const;
