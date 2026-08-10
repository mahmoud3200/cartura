"use client";

import { useActionState } from "react";

import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useActionToast } from "@/shared/hooks/use-action-toast";

import { registerAction, type AuthActionState } from "../actions";
import { FieldError } from "../ui/field-error";
import { SubmitButton } from "../ui/submit-button";

const initialState: AuthActionState = {
  ok: false,
};

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initialState);
  useActionToast(state, {
    errorTitle: "Registration failed",
  });

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First name</Label>
          <Input
            id="firstName"
            name="firstName"
            autoComplete="given-name"
            aria-invalid={Boolean(state.fieldErrors?.firstName)}
            className="h-10 rounded-md"
            required
          />
          <FieldError message={state.fieldErrors?.firstName?.[0]} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            aria-invalid={Boolean(state.fieldErrors?.lastName)}
            className="h-10 rounded-md"
            required
          />
          <FieldError message={state.fieldErrors?.lastName?.[0]} />
        </div>
      </div>
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
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
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
        <p className="text-xs leading-5 text-muted-foreground">
          Use at least 8 characters.
        </p>
        <FieldError message={state.fieldErrors?.password?.[0]} />
      </div>
      <SubmitButton pendingLabel="Creating account...">Create account</SubmitButton>
    </form>
  );
}
