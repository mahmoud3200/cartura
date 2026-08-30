"use server";

import {
  updateUserStatusRequestSchema,
  type UpdateUserStatusRequest,
  type User,
} from "@cartura/contracts/users";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { enforceBffRateLimit } from "@/shared/rate-limit";

import {
  managementActionFailure,
  type ManagementActionResult,
} from "@/features/management/shared/lib/action-result";
import { updateManagementUserStatus } from "../api/users-api";

export async function updateUserStatusAction(
  userId: string,
  input: UpdateUserStatusRequest,
): Promise<ManagementActionResult<User>> {
  const id = z.uuid().safeParse(userId);
  const body = updateUserStatusRequestSchema.safeParse(input);

  if (!id.success || !body.success) {
    return { ok: false, message: "Choose a valid account status." };
  }

  try {
    await enforceBffRateLimit("privileged");
    const user = await updateManagementUserStatus(id.data, body.data);
    revalidatePath("/dashboard/users");
    return { ok: true, data: user };
  } catch (error) {
    return managementActionFailure(error);
  }
}
