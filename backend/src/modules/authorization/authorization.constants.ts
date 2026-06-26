// Refine for prisma/seeds/authorizaation.seed.ts for seed data <3

export const PERMISSIONS = {
  USERS_READ: "users.read",
  USERS_UPDATE_STATUS: "users.status.update",
  USERS_ASSIGN_ROLES: "users.roles.assign",

  ROLES_READ: "roles.read",
  ROLES_CREATE: "roles.create",
  ROLES_UPDATE: "roles.update",
  ROLES_DELETE: "roles.delete",
  ROLES_UPDATE_PERMISSIONS: "roles.permissions.update",

  CATEGORIES_CREATE: "categories.create",
  CATEGORIES_UPDATE: "categories.update",
  CATEGORIES_DELETE: "categories.delete",

  PRODUCTS_CREATE: "products.create",
  PRODUCTS_UPDATE: "products.update",
  PRODUCTS_DELETE: "products.delete",
  INVENTORY_UPDATE: "inventory.update",

  ORDERS_READ: "orders.read",
  ORDERS_UPDATE: "orders.update",

  REFUNDS_READ: "refunds.read",
  REFUNDS_CREATE: "refunds.create",

  AUDIT_LOGS_READ: "audit_logs.read",
} as const;

export type PermissionName = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const SYSTEM_ROLES = {
  CUSTOMER: "customer",
  SUPPORT_AGENT: "support_agent",
  CATALOG_MANAGER: "catalog_manager",
  ORDER_MANAGER: "order_manager",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin",
} as const;

export type SystemRoleName = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];
