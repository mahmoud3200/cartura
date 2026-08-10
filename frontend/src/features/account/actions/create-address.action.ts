"use server";

import { createAddressRequestSchema } from "@cartura/contracts/addresses";
import { revalidatePath } from "next/cache";

import {
  actionFailure,
  getOptionalString,
  getString,
  validationFailure,
} from "@/shared/lib/actions-utils";

import { createAddress } from "../api/addresses-api";
import type { AddressActionState, AddressFormValues } from "../types";

export async function createAddressAction(
  _state: AddressActionState,
  formData: FormData,
): Promise<AddressActionState> {
  const values: AddressFormValues = {
    addressName: getString(formData, "addressName"),
    recipientName: getString(formData, "recipientName"),
    phoneNumber: getString(formData, "phoneNumber"),
    country: getString(formData, "country"),
    city: getString(formData, "city"),
    area: getString(formData, "area"),
    streetAddress: getString(formData, "streetAddress"),
    postalCode: getOptionalString(formData, "postalCode"),
    isDefault: formData.get("isDefault") === "on",
  };
  const input = createAddressRequestSchema.safeParse(values);

  if (!input.success) {
    return {
      ...validationFailure(input.error),
      values,
    };
  }

  try {
    await createAddress(input.data);
    revalidatePath("/settings/addresses");
    revalidatePath("/settings");
    return { ok: true, message: "Address saved." };
  } catch (error) {
    return {
      ...actionFailure(error),
      values,
    };
  }
}
