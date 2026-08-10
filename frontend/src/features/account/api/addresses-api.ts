import "server-only";

import {
  addressDataResponseSchema,
  addressListResponseSchema,
  type CreateAddressRequest,
  type UpdateAddressRequest,
} from "@cartura/contracts/addresses";

import { serverApiFetch } from "@/shared/api/server-api";

export async function listAddresses() {
  const payload = await serverApiFetch<unknown>("/api/v1/addresses");
  return addressListResponseSchema.parse(payload).data;
}

export async function createAddress(input: CreateAddressRequest) {
  const payload = await serverApiFetch<unknown>("/api/v1/addresses", {
    method: "POST",
    json: input,
  });

  return addressDataResponseSchema.parse(payload).data;
}

export async function updateAddress(
  addressId: string,
  input: UpdateAddressRequest,
) {
  const payload = await serverApiFetch<unknown>(`/api/v1/addresses/${addressId}`, {
    method: "PATCH",
    json: input,
  });

  return addressDataResponseSchema.parse(payload).data;
}

export async function setDefaultAddress(addressId: string) {
  const payload = await serverApiFetch<unknown>(
    `/api/v1/addresses/${addressId}/default`,
    { method: "PATCH" },
  );

  return addressDataResponseSchema.parse(payload).data;
}

export async function deleteAddress(addressId: string) {
  await serverApiFetch<unknown>(`/api/v1/addresses/${addressId}`, {
    method: "DELETE",
  });
}
