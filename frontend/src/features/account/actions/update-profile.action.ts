"use server";

import { updateProfileRequestSchema } from "@cartura/contracts/auth";
import { revalidatePath } from "next/cache";

import {
  actionFailure,
  getString,
  validationFailure,
} from "@/shared/lib/actions-utils";

import { updateProfile } from "../api/profile-api";
import type { AccountActionState } from "../types";

export async function updateProfileAction(
  _state: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const input = updateProfileRequestSchema.safeParse({
    firstName: getString(formData, "firstName"),
    lastName: getString(formData, "lastName"),
  });

  if (!input.success) {
    return validationFailure(input.error);
  }

  try {
    await updateProfile(input.data);
    revalidatePath("/settings", "layout");
    return { ok: true, message: "Your profile has been updated." };
  } catch (error) {
    return actionFailure(error);
  }
}
