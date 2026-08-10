"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { actionFailure, getString } from "@/shared/lib/actions-utils";

import { setDefaultAddress } from "../api/addresses-api";
import type { AccountActionState } from "../types";

const addressIdSchema = z.uuid();

export async function setDefaultAddressAction(
  _state: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const addressId = addressIdSchema.safeParse(getString(formData, "addressId"));

  if (!addressId.success) {
    return { ok: false, message: "This address could not be selected." };
  }

  try {
    await setDefaultAddress(addressId.data);
    revalidatePath("/settings/addresses");
    revalidatePath("/settings");
    return { ok: true, message: "Default address updated." };
  } catch (error) {
    return actionFailure(error);
  }
}
