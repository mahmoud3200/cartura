"use client";

import { useActionState } from "react";

import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useActionToast } from "@/shared/hooks/use-action-toast";

import {
  resetPasswordAction,
  type AuthActionState,
} from "../actions";
import { FieldError } from "../ui/field-error";
import { SubmitButton } from "../ui/submit-button";

const initialState: AuthActionState = {
  ok: false,
};

export function ResetPasswordForm({
  defaultEmail = "",
}: {
  defaultEmail?: string;
}) {
  const [state, formAction] = useActionState(resetPasswordAction, initialState);
  useActionToast(state, {
    errorTitle: "Password reset failed",
  });

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={defaultEmail}
          autoComplete="email"
          aria-invalid={Boolean(state.fieldErrors?.email)}
          className="h-10 rounded-md"
          required
        />
        <FieldError message={state.fieldErrors?.email?.[0]} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="code">Reset code</Label>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          aria-invalid={Boolean(state.fieldErrors?.code)}
          className="h-10 rounded-md"
          required
        />
        <FieldError message={state.fieldErrors?.code?.[0]} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(state.fieldErrors?.password)}
          className="h-10 rounded-md"
          minLength={8}
          required
        />
        <FieldError message={state.fieldErrors?.password?.[0]} />
      </div>
      <SubmitButton pendingLabel="Resetting password...">
        Reset password
      </SubmitButton>
    </form>
  );
}
