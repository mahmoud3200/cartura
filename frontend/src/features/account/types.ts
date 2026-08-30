import type { ActionRateLimitMetadata } from "@/shared/types";
import type { CustomerRefund } from "@cartura/contracts/refunds";

export type AccountActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
} & ActionRateLimitMetadata;

export type AddressFormValues = {
  addressName?: string;
  recipientName?: string;
  phoneNumber?: string;
  country?: string;
  city?: string;
  area?: string;
  streetAddress?: string;
  postalCode?: string | null;
  isDefault?: boolean;
};

export type AddressActionState = AccountActionState & {
  values?: AddressFormValues;
};

export type ReturnActionResult =
  | { ok: true; data: CustomerRefund }
  | ({ ok: false; message: string } & ActionRateLimitMetadata);
