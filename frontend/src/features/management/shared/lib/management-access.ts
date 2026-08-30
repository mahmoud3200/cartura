import {
  PERMISSIONS,
  type PermissionName,
} from "@cartura/contracts/authorization";

const routePermissions: Record<string, readonly PermissionName[]> = {
  "/dashboard": [PERMISSIONS.ANALYTICS_READ],
  "/dashboard/products": [
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.PRODUCTS_DELETE,
    PERMISSIONS.INVENTORY_UPDATE,
  ],
  "/dashboard/categories": [
    PERMISSIONS.CATEGORIES_CREATE,
    PERMISSIONS.CATEGORIES_UPDATE,
    PERMISSIONS.CATEGORIES_DELETE,
  ],
  "/dashboard/orders": [PERMISSIONS.ORDERS_READ, PERMISSIONS.ORDERS_UPDATE],
  "/dashboard/users": [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_UPDATE_STATUS,
    PERMISSIONS.USERS_UPDATE_ROLE,
  ],
  "/dashboard/refunds": [
    PERMISSIONS.REFUNDS_READ,
    PERMISSIONS.REFUNDS_CREATE,
    PERMISSIONS.REFUNDS_EXECUTE,
  ],
  "/dashboard/payments": [
    PERMISSIONS.PAYMENT_WEBHOOKS_READ,
    PERMISSIONS.PAYMENT_WEBHOOKS_REPROCESS,
  ],
  "/dashboard/roles": [
    PERMISSIONS.ROLES_READ,
    PERMISSIONS.ROLES_CREATE,
    PERMISSIONS.ROLES_UPDATE,
    PERMISSIONS.ROLES_DELETE,
    PERMISSIONS.ROLES_UPDATE_PERMISSIONS,
  ],
  "/dashboard/audit": [PERMISSIONS.AUDIT_LOGS_READ],
};

const landingRouteOrder = [
  "/dashboard",
  "/dashboard/orders",
  "/dashboard/products",
  "/dashboard/categories",
  "/dashboard/users",
  "/dashboard/refunds",
  "/dashboard/payments",
  "/dashboard/roles",
  "/dashboard/audit",
] as const;

export function hasManagementAccess(permissionNames: readonly string[]) {
  return permissionNames.length > 0;
}

export function canAccessManagementRoute(
  href: string,
  permissionNames: readonly string[],
) {
  const required = routePermissions[href];

  if (!required) {
    return false;
  }

  const granted = new Set(permissionNames);
  return required.some((permission) => granted.has(permission));
}

export function isManagementRouteActive(pathname: string, href: string) {
  return href === "/dashboard"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function getManagementLandingPath(permissionNames: readonly string[]) {
  return (
    landingRouteOrder.find((href) =>
      canAccessManagementRoute(href, permissionNames),
    ) ?? null
  );
}
