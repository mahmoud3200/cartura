"use server";

import {
  updateUserRoleRequestSchema,
  type UpdateUserRoleRequest,
} from "@cartura/contracts/authorization";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  managementActionFailure,
  type ManagementActionResult,
} from "@/features/management/shared/lib/action-result";
import { updateManagementUserRole } from "../api/users-api";

export async function updateUserRoleAction(
  userId: string,
  input: UpdateUserRoleRequest,
): Promise<ManagementActionResult<null>> {
  const id = z.uuid().safeParse(userId);
  const body = updateUserRoleRequestSchema.safeParse(input);

  if (!id.success || !body.success) {
    return { ok: false, message: "Choose a valid role." };
  }

  try {
    await updateManagementUserRole(id.data, body.data);
    revalidatePath("/dashboard/users");
    return { ok: true, data: null };
  } catch (error) {
    return managementActionFailure(error);
  }
}
