"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useActionToast } from "@/shared/hooks/use-action-toast";

import { loginAction, type AuthActionState } from "../actions";
import { FieldError } from "../ui/field-error";
import { SubmitButton } from "../ui/submit-button";

const initialState: AuthActionState = {
  ok: false,
};

export function LoginForm({ redirectTo = "/" }: { redirectTo?: string }) {
  const [state, formAction] = useActionState(loginAction, initialState);
  useActionToast(state, {
    errorTitle: "Sign in failed",
  });

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="redirectTo" value={redirectTo} />
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
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/auth/forgot-password"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(state.fieldErrors?.password)}
          className="h-10 rounded-md"
          required
        />
        <FieldError message={state.fieldErrors?.password?.[0]} />
      </div>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          name="rememberMe"
          className="size-4 rounded border-input accent-primary"
        />
        Stay signed in on this device
      </label>
      <SubmitButton pendingLabel="Signing in...">Sign in</SubmitButton>
    </form>
  );
}
