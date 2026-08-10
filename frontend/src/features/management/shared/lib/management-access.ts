const routePermissions: Record<string, readonly string[]> = {
  "/dashboard": ["analytics.read"],
  "/dashboard/products": [
    "products.create",
    "products.update",
    "products.delete",
    "inventory.update",
  ],
  "/dashboard/categories": [
    "categories.create",
    "categories.update",
    "categories.delete",
  ],
  "/dashboard/orders": ["orders.read", "orders.update"],
  "/dashboard/users": [
    "users.read",
    "users.status.update",
    "users.role.update",
  ],
  "/dashboard/refunds": [
    "refunds.read",
    "refunds.create",
    "refunds.execute",
  ],
  "/dashboard/payments": [
    "payments.webhooks.read",
    "payments.webhooks.reprocess",
  ],
  "/dashboard/roles": [
    "roles.read",
    "roles.create",
    "roles.update",
    "roles.delete",
    "roles.permissions.update",
  ],
  "/dashboard/audit": ["audit_logs.read"],
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
