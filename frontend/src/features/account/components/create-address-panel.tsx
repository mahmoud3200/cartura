"use client";

import { Plus } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";

import { useActionToast } from "@/shared/hooks/use-action-toast";

import { createAddressAction } from "../actions/create-address.action";
import { useFocusFirstFieldError } from "../hooks/use-focus-first-field-error";
import type { AddressActionState } from "../types";
import { AccountSubmitButton } from "../ui/account-submit-button";
import { AddressFormFields } from "../ui/address-form-fields";

const initialState: AddressActionState = { ok: false };

export function CreateAddressPanel() {
  const [state, action] = useActionState(createAddressAction, initialState);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstFieldError(formRef, state.fieldErrors);
  useActionToast(state, {
    successTitle: "Address saved",
    errorTitle: "Address could not be saved",
  });

  useEffect(() => {
    if (!state.ok) return;

    formRef.current?.reset();
    detailsRef.current?.removeAttribute("open");
  }, [state.ok]);

  return (
    <details
      ref={detailsRef}
      className="group rounded-xl border border-border bg-card open:shadow-[0_18px_55px_color-mix(in_oklch,var(--foreground),transparent_95%)]"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-5 py-4 font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:px-6">
        <span className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Plus className="size-4" />
          </span>
          Add a new address
        </span>
        <span className="text-xs text-muted-foreground group-open:hidden">Open form</span>
        <span className="hidden text-xs text-muted-foreground group-open:inline">Close form</span>
      </summary>
      <form
        ref={formRef}
        action={action}
        className="border-t border-border px-5 py-6 sm:px-6"
      >
        <AddressFormFields
          idPrefix="new-address"
          values={state.values}
          fieldErrors={state.fieldErrors}
          includeDefault
        />
        <div className="mt-6 flex justify-end">
          <AccountSubmitButton pendingLabel="Saving address...">Save address</AccountSubmitButton>
        </div>
      </form>
    </details>
  );
}
