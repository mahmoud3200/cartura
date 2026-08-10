"use client";

import type { AddressResponse } from "@cartura/contracts/addresses";
import { Check, MapPin, Pencil, Trash2 } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";

import { useActionToast } from "@/shared/hooks/use-action-toast";

import { deleteAddressAction } from "../actions/delete-address.action";
import { setDefaultAddressAction } from "../actions/set-default-address.action";
import { updateAddressAction } from "../actions/update-address.action";
import { useFocusFirstFieldError } from "../hooks/use-focus-first-field-error";
import type { AccountActionState, AddressActionState } from "../types";
import { AccountSubmitButton } from "../ui/account-submit-button";
import { AddressFormFields } from "../ui/address-form-fields";

const initialState: AccountActionState = { ok: false };
const initialAddressState: AddressActionState = { ok: false };

export function AddressCard({ address }: { address: AddressResponse }) {
  const editorRef = useRef<HTMLDetailsElement>(null);
  const editFormRef = useRef<HTMLFormElement>(null);
  const [updateState, updateAction] = useActionState(
    updateAddressAction,
    initialAddressState,
  );
  const [defaultState, defaultAction] = useActionState(setDefaultAddressAction, initialState);
  const [deleteState, deleteAction] = useActionState(deleteAddressAction, initialState);
  useFocusFirstFieldError(editFormRef, updateState.fieldErrors);

  useActionToast(updateState, { successTitle: "Address updated", errorTitle: "Update failed" });
  useActionToast(defaultState, { successTitle: "Default address updated", errorTitle: "Update failed" });
  useActionToast(deleteState, { successTitle: "Address removed", errorTitle: "Delete failed" });

  useEffect(() => {
    if (!updateState.ok) return;

    editorRef.current?.removeAttribute("open");
  }, [updateState.ok]);

  return (
    <article className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted">
            <MapPin className="size-5" strokeWidth={1.7} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">{address.addressName}</h2>
              {address.isDefault ? (
                <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                  Default
                </span>
              ) : null}
            </div>
            <address className="mt-3 text-sm not-italic leading-6 text-muted-foreground">
              <span className="text-foreground">{address.recipientName}</span>
              <br />
              {address.streetAddress}
              <br />
              {address.area}, {address.city}
              <br />
              {address.country}{address.postalCode ? ` ${address.postalCode}` : ""}
              <br />
              {address.phoneNumber}
            </address>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          {!address.isDefault ? (
            <form action={defaultAction}>
              <input type="hidden" name="addressId" value={address.id} />
              <AccountSubmitButton pendingLabel="Setting default..." variant="outline">
                <Check className="size-4" /> Default
              </AccountSubmitButton>
            </form>
          ) : null}
          <form action={deleteAction}>
            <input type="hidden" name="addressId" value={address.id} />
            <AccountSubmitButton pendingLabel="Removing..." variant="destructive">
              <Trash2 className="size-4" /> Remove
            </AccountSubmitButton>
          </form>
        </div>
      </div>

      <details ref={editorRef} className="group mt-5 border-t border-border pt-4">
        <summary className="flex w-fit cursor-pointer list-none items-center gap-2 rounded-md text-sm font-medium outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
          <Pencil className="size-3.5" />
          <span className="group-open:hidden">Edit address</span>
          <span className="hidden group-open:inline">Close editor</span>
        </summary>
        <form
          ref={editFormRef}
          action={updateAction}
          className="mt-5 rounded-lg bg-muted/45 p-4 sm:p-5"
        >
          <input type="hidden" name="addressId" value={address.id} />
          <AddressFormFields
            idPrefix={`address-${address.id}`}
            values={address}
            fieldErrors={updateState.fieldErrors}
          />
          <div className="mt-6 flex justify-end">
            <AccountSubmitButton pendingLabel="Saving changes...">Save changes</AccountSubmitButton>
          </div>
        </form>
      </details>
    </article>
  );
}
