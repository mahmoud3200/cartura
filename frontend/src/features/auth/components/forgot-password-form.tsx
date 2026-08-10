"use client";

import { useActionState } from "react";

import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useActionToast } from "@/shared/hooks/use-action-toast";

import {
  forgotPasswordAction,
  type AuthActionState,
} from "../actions";
import { FieldError } from "../ui/field-error";
import { SubmitButton } from "../ui/submit-button";

const initialState: AuthActionState = {
  ok: false,
};

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, initialState);
  useActionToast(state, {
    errorTitle: "Reset request failed",
  });

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(state.fieldErrors?.email)}
          className="h-10 rounded-md"
          required
        />
        <FieldError message={state.fieldErrors?.email?.[0]} />
      </div>
      <SubmitButton pendingLabel="Sending code...">Send reset code</SubmitButton>
    </form>
  );
}
