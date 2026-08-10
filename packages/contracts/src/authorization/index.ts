import { z } from "zod";

export const listRolesQuerySchema = z.preprocess((value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const query = value as Record<string, unknown>;

  return {
    ...query,
    limit: query.limit ?? query.pageSize,
  };
}, z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  q: z.string().trim().min(1).max(100).optional(),
}));

export const createRoleRequestSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional(),
  permissionIds: z.array(z.uuid()).default([]),
});

export const updateRoleRequestSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  permissionIds: z.array(z.uuid()).optional(),
});

export const updateRolePermissionsRequestSchema = z.object({
  permissionIds: z.array(z.uuid()),
});

export const updateUserRoleRequestSchema = z.object({
  roleId: z.uuid(),
});

export const permissionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
});

export const rolePermissionSchema = z.object({
  permission: permissionSchema,
});

export const roleSchema = z.object({
  id: z.string(),
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

export const permissionNameListSchema = z.array(z.string());

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
