"use server";

import {
  createRoleRequestSchema,
  type CreateRoleRequest,
} from "@cartura/contracts/authorization";

import {
  managementActionFailure,
  type ManagementActionResult,
} from "@/features/management/shared/lib/action-result";

import { createManagementRole } from "../api/roles-api";

export async function createRoleAction(
  input: CreateRoleRequest,
): Promise<ManagementActionResult<null>> {
  const parsed = createRoleRequestSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Check the role details and try again." };
  }

  try {
    await createManagementRole(parsed.data);
    return { ok: true, data: null };
  } catch (error) {
    return managementActionFailure(error);
  }
}
