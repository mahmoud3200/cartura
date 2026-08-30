"use server";

import {
  updateRolePermissionsRequestSchema,
  updateRoleRequestSchema,
  type UpdateRolePermissionsRequest,
  type UpdateRoleRequest,
} from "@cartura/contracts/authorization";
import { z } from "zod";
import { enforceBffRateLimit } from "@/shared/rate-limit";

import {
  managementActionFailure,
  type ManagementActionResult,
} from "@/features/management/shared/lib/action-result";

import {
  updateManagementRole,
  updateManagementRolePermissions,
} from "../api/roles-api";

type UpdateRoleActionInput = {
  roleId: string;
  role: UpdateRoleRequest;
  permissions: UpdateRolePermissionsRequest;
};

const updateRoleActionSchema = z
  .object({
    roleId: z.uuid(),
    role: updateRoleRequestSchema,
    permissions: updateRolePermissionsRequestSchema,
  })
  .strict();

export async function updateRoleAction(
  input: UpdateRoleActionInput,
): Promise<ManagementActionResult<null>> {
  const parsed = updateRoleActionSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Check the role details and try again." };
  }

  try {
    await enforceBffRateLimit("privileged");
    await updateManagementRole(parsed.data);
    await updateManagementRolePermissions({
      roleId: parsed.data.roleId,
      permissions: parsed.data.permissions,
    });
    return { ok: true, data: null };
  } catch (error) {
    return managementActionFailure(error);
  }
}
