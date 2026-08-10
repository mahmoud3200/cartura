export type AccountActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

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
