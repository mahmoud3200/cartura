"use server";

import {
  updateRoleRequestSchema,
  type UpdateRoleRequest,
} from "@cartura/contracts/authorization";
import { z } from "zod";

import {
  managementActionFailure,
  type ManagementActionResult,
} from "@/features/management/shared/lib/action-result";

import { updateManagementRole } from "../api/roles-api";

type UpdateRoleActionInput = {
  roleId: string;
  role: UpdateRoleRequest;
};

const updateRoleActionSchema = z.object({
  roleId: z.uuid(),
  role: updateRoleRequestSchema,
});

export async function updateRoleAction(
  input: UpdateRoleActionInput,
): Promise<ManagementActionResult<null>> {
  const parsed = updateRoleActionSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Check the role details and try again." };
  }

  try {
    await updateManagementRole(parsed.data);
    return { ok: true, data: null };
  } catch (error) {
    return managementActionFailure(error);
  }
}
