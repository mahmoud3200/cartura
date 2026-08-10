"use server";

import { z } from "zod";

import {
  managementActionFailure,
  type ManagementActionResult,
} from "@/features/management/shared/lib/action-result";

import { deleteManagementRole } from "../api/roles-api";

export async function deleteRoleAction(
  roleId: string,
): Promise<ManagementActionResult<null>> {
  const parsed = z.uuid().safeParse(roleId);

  if (!parsed.success) {
    return { ok: false, message: "Choose a valid role and try again." };
  }

  try {
    await deleteManagementRole(parsed.data);
    return { ok: true, data: null };
  } catch (error) {
    return managementActionFailure(error);
  }
}
