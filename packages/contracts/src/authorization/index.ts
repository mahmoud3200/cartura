import { z } from "zod";
import { paginatedQuerySchema } from "../common/index.js";

export const PERMISSIONS = {
  USERS_READ: "users.read",
  USERS_UPDATE_STATUS: "users.status.update",
  USERS_UPDATE_ROLE: "users.role.update",
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
  REFUNDS_EXECUTE: "refunds.execute",
  PAYMENT_WEBHOOKS_READ: "payments.webhooks.read",
  PAYMENT_WEBHOOKS_REPROCESS: "payments.webhooks.reprocess",
  ANALYTICS_READ: "analytics.read",
  AUDIT_LOGS_READ: "audit_logs.read",
} as const;

export const SYSTEM_ROLES = {
  CUSTOMER: "customer",
  SUPPORT_AGENT: "support_agent",
  CATALOG_MANAGER: "catalog_manager",
  ORDER_MANAGER: "order_manager",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin",
} as const;

export const permissionNameSchema = z.enum(PERMISSIONS);
export const systemRoleNameSchema = z.enum(SYSTEM_ROLES);

const permissionIdListSchema = z
  .array(z.uuid())
  .max(Object.keys(PERMISSIONS).length)
  .transform((permissionIds) => [...new Set(permissionIds)].sort());

export const listRolesQuerySchema = paginatedQuerySchema({
  q: z.string().trim().min(1).max(100).optional(),
});

export const createRoleRequestSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    description: z.string().trim().max(500).optional(),
    permissionIds: permissionIdListSchema.default([]),
  })
  .strict();

export const updateRoleRequestSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    description: z.string().trim().max(500).nullable().optional(),
  })
  .strict()
  .refine((input) => Object.values(input).some((value) => value !== undefined), {
    message: "At least one field is required",
  });

export const updateRolePermissionsRequestSchema = z
  .object({
    permissionIds: permissionIdListSchema,
  })
  .strict();

export const updateUserRoleRequestSchema = z.object({
  roleId: z.uuid(),
}).strict();

export const roleIdParamsSchema = z.object({ roleId: z.uuid() }).strict();
export const authorizationUserIdParamsSchema = z
  .object({ userId: z.uuid() })
  .strict();

export const permissionSchema = z.object({
  id: z.uuid(),
  name: permissionNameSchema,
  description: z.string().nullable(),
});

export const rolePermissionSchema = z.object({
  permission: permissionSchema,
});

export const roleSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  isSystemRole: z.boolean(),
  rolePermissions: z.array(rolePermissionSchema),
});

export const userRoleOptionSchema = roleSchema.pick({
  id: true,
  name: true,
  description: true,
  isSystemRole: true,
});

export const permissionNameListSchema = z.array(permissionNameSchema);

export type CreateRoleRequest = z.infer<typeof createRoleRequestSchema>;
export type ListRolesQuery = z.infer<typeof listRolesQuerySchema>;
export type UpdateRoleRequest = z.infer<typeof updateRoleRequestSchema>;
export type UpdateRolePermissionsRequest = z.infer<
  typeof updateRolePermissionsRequestSchema
>;
export type UpdateUserRoleRequest = z.infer<typeof updateUserRoleRequestSchema>;
export type Permission = z.infer<typeof permissionSchema>;
export type RolePermission = z.infer<typeof rolePermissionSchema>;
export type Role = z.infer<typeof roleSchema>;
export type UserRoleOption = z.infer<typeof userRoleOptionSchema>;
export type PermissionName = z.infer<typeof permissionNameSchema>;
export type SystemRoleName = z.infer<typeof systemRoleNameSchema>;
