import type { AddressResponse } from "@cartura/contracts/addresses";

export function formatCartMoney(value: number, currency = "EGP") {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCartAddressOption(address: AddressResponse) {
  return `${address.addressName}${address.isDefault ? " (default)" : ""} - ${address.area}, ${address.city}`;
}
