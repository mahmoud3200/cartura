"use client";

import type { AuthUser } from "@cartura/contracts/auth";
import { useActionState } from "react";

import { useActionToast } from "@/shared/hooks/use-action-toast";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

import { updateProfileAction } from "../actions/update-profile.action";
import type { AccountActionState } from "../types";
import { AccountSubmitButton } from "../ui/account-submit-button";

const initialState: AccountActionState = { ok: false };

export function ProfileForm({ user }: { user: AuthUser }) {
  const [state, action] = useActionState(updateProfileAction, initialState);
  useActionToast(state, {
    successTitle: "Profile updated",
    errorTitle: "Profile update failed",
  });

  return (
    <form action={action} className="mt-8 max-w-2xl rounded-xl border border-border bg-card p-5 sm:p-7">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="First name" name="firstName" defaultValue={user.firstName} error={state.fieldErrors?.firstName?.[0]} />
        <Field label="Last name" name="lastName" defaultValue={user.lastName} error={state.fieldErrors?.lastName?.[0]} />
      </div>
      <div className="mt-5 space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input id="email" value={user.email} disabled className="h-10" />
        <p className="text-xs leading-5 text-muted-foreground">
          Email changes require a separate verification flow and are currently managed by support.
        </p>
      </div>
      <div className="mt-7 flex justify-end border-t border-border pt-5">
        <AccountSubmitButton pendingLabel="Saving profile...">Save profile</AccountSubmitButton>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  error,
}: {
  label: string;
  name: string;
  defaultValue: string;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        defaultValue={defaultValue}
        autoComplete={name === "firstName" ? "given-name" : "family-name"}
        aria-invalid={Boolean(error)}
        className="h-10"
        required
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
