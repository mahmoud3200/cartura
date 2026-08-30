"use server";

import { updateAddressRequestSchema } from "@cartura/contracts/addresses";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  actionFailure,
  getOptionalString,
  getString,
  validationFailure,
} from "@/shared/lib/actions-utils";
import { enforceBffRateLimit } from "@/shared/rate-limit";

import { updateAddress } from "../api/addresses-api";
import type { AddressActionState, AddressFormValues } from "../types";

const updateAddressActionSchema = updateAddressRequestSchema.and(
  z.object({ addressId: z.uuid() }),
);

export async function updateAddressAction(
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
    postalCode: getOptionalString(formData, "postalCode") ?? null,
  };
  const input = updateAddressActionSchema.safeParse({
    addressId: getString(formData, "addressId"),
    ...values,
  });

  if (!input.success) {
    return {
      ...validationFailure(input.error),
      values,
    };
  }

  const { addressId, ...address } = input.data;

  try {
    await enforceBffRateLimit("mutation");
    await updateAddress(addressId, address);
    revalidatePath("/settings/addresses");
    revalidatePath("/settings");
    return { ok: true, message: "Address updated." };
  } catch (error) {
    return {
      ...actionFailure(error),
      values,
    };
  }
}
