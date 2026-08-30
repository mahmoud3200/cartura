import type { AddressResponse } from "@cartura/contracts/addresses";

import type { Address } from "../../generated/prisma/client.js";

export function mapAddress(address: Address): AddressResponse {
  return {
    id: address.id,
    userId: address.userId,
    addressName: address.addressName,
    recipientName: address.recipientName,
    phoneNumber: address.phoneNumber,
    country: address.country,
    city: address.city,
    area: address.area,
    streetAddress: address.streetAddress,
    postalCode: address.postalCode,
    isDefault: address.isDefault,
    createdAt: address.createdAt.toISOString(),
    updatedAt: address.updatedAt.toISOString(),
  };
}
