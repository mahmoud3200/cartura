"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { actionFailure, getString } from "@/shared/lib/actions-utils";
import { enforceBffRateLimit } from "@/shared/rate-limit";

import { deleteAddress } from "../api/addresses-api";
import type { AccountActionState } from "../types";

const addressIdSchema = z.uuid();

export async function deleteAddressAction(
  _state: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const addressId = addressIdSchema.safeParse(getString(formData, "addressId"));

  if (!addressId.success) {
    return { ok: false, message: "This address could not be removed." };
  }

  try {
    await enforceBffRateLimit("mutation");
    await deleteAddress(addressId.data);
    revalidatePath("/settings/addresses");
    revalidatePath("/settings");
    return { ok: true, message: "Address removed." };
  } catch (error) {
    return actionFailure(error);
  }
}
