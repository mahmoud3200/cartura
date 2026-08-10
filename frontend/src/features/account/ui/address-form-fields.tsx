"use client";

import type { AddressResponse } from "@cartura/contracts/addresses";

import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectItem,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import type { AddressFormValues } from "../types";

type AddressValues = Partial<AddressResponse> | AddressFormValues;
const countryOptions = createCountryOptions();

export function AddressFormFields({
  idPrefix,
  values = {},
  fieldErrors,
  includeDefault = false,
}: {
  idPrefix: string;
  values?: AddressValues;
  fieldErrors?: Record<string, string[] | undefined>;
  includeDefault?: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <AddressField id={`${idPrefix}-name`} label="Address name" name="addressName" value={values.addressName} error={fieldErrors?.addressName?.[0]} autoComplete="off" />
      <AddressField id={`${idPrefix}-recipient`} label="Recipient name" name="recipientName" value={values.recipientName} error={fieldErrors?.recipientName?.[0]} autoComplete="name" />
      <AddressField id={`${idPrefix}-phone`} label="Phone number" name="phoneNumber" value={values.phoneNumber} error={fieldErrors?.phoneNumber?.[0]} autoComplete="tel" />
      <CountryField
        id={`${idPrefix}-country`}
        value={values.country}
        error={fieldErrors?.country?.[0]}
      />
      <AddressField id={`${idPrefix}-city`} label="City" name="city" value={values.city} error={fieldErrors?.city?.[0]} autoComplete="address-level2" />
      <AddressField id={`${idPrefix}-area`} label="Area or district" name="area" value={values.area} error={fieldErrors?.area?.[0]} autoComplete="address-level3" />
      <div className="sm:col-span-2">
        <AddressField id={`${idPrefix}-street`} label="Street address" name="streetAddress" value={values.streetAddress} error={fieldErrors?.streetAddress?.[0]} autoComplete="street-address" />
      </div>
      <AddressField
        id={`${idPrefix}-postal`}
        label="Postal code"
        name="postalCode"
        value={values.postalCode ?? ""}
        error={fieldErrors?.postalCode?.[0]}
        autoComplete="postal-code"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={30}
        title="Use numbers only."
        required={false}
      />
      {includeDefault ? (
        <div className="flex items-center gap-3 self-end pb-2">
          <Checkbox id={`${idPrefix}-default`} name="isDefault" defaultChecked={values.isDefault} />
          <Label htmlFor={`${idPrefix}-default`} className="font-normal">Use as my default address</Label>
        </div>
      ) : null}
    </div>
  );
}

function AddressField({
  id,
  label,
  name,
  value,
  error,
  autoComplete,
  inputMode,
  pattern,
  maxLength,
  title,
  required = true,
}: {
  id: string;
  label: string;
  name: string;
  value?: string;
  error?: string;
  autoComplete: string;
  inputMode?: "numeric";
  pattern?: string;
  maxLength?: number;
  title?: string;
  required?: boolean;
}) {
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        defaultValue={value}
        autoComplete={autoComplete}
        inputMode={inputMode}
        pattern={pattern}
        maxLength={maxLength}
        title={title}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="h-10"
        required={required}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function CountryField({
  id,
  value,
  error,
}: {
  id: string;
  value?: string;
  error?: string;
}) {
  const options =
    value && !countryOptions.includes(value)
      ? [value, ...countryOptions]
      : countryOptions;
  const selectedCountry = value ?? "Egypt";
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Country</Label>
      <Select
        name="country"
        defaultValue={selectedCountry}
        items={options.map((country) => ({
          value: country,
          label: country,
        }))}
      >
        <SelectTrigger
          id={id}
          className="h-10"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        >
          <SelectValue>{selectedCountry}</SelectValue>
        </SelectTrigger>
        <SelectPortal>
          <SelectPositioner>
            <SelectPopup>
              <SelectList>
                {options.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectList>
            </SelectPopup>
          </SelectPositioner>
        </SelectPortal>
      </Select>
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function createCountryOptions() {
  if (typeof Intl.DisplayNames !== "function") {
    return ["Egypt"];
  }

  const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
  const countries: string[] = [];

  for (let first = 65; first <= 90; first += 1) {
    for (let second = 65; second <= 90; second += 1) {
      const code = String.fromCharCode(first, second);
      const name = displayNames.of(code);

      if (name && name !== code) {
        countries.push(name);
      }
    }
  }

  return Array.from(new Set(countries)).sort((left, right) =>
    left.localeCompare(right),
  );
}
