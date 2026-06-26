import { z } from "zod";

export const createRoleRequestSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional(),
  permissionIds: z.array(z.uuid()).default([]),
});

export const updateRoleRequestSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(500).optional(),
});

export const updateRolePermissionsRequestSchema = z.object({
  permissionIds: z.array(z.uuid()),
});

export const assignUserRoleRequestSchema = z.object({
  roleId: z.uuid(),
});

export type CreateRoleRequest = z.infer<typeof createRoleRequestSchema>;
export type UpdateRoleRequest = z.infer<typeof updateRoleRequestSchema>;
export type UpdateRolePermissionsRequest = z.infer<
  typeof updateRolePermissionsRequestSchema
>;
export type AssignUserRoleRequest = z.infer<typeof assignUserRoleRequestSchema>;
