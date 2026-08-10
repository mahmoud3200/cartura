"use client";

import { useActionState } from "react";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useActionToast } from "@/shared/hooks/use-action-toast";

import {
  resendVerificationEmailAction,
  verifyEmailAction,
  type AuthActionState,
} from "../actions";
import { FieldError } from "../ui/field-error";
import { SubmitButton } from "../ui/submit-button";

const initialState: AuthActionState = {
  ok: false,
};

export function VerifyEmailForm({ defaultEmail = "" }: { defaultEmail?: string }) {
  const [verifyState, verifyFormAction] = useActionState(
    verifyEmailAction,
    initialState,
  );
  const [resendState, resendFormAction] = useActionState(
    resendVerificationEmailAction,
    initialState,
  );
  useActionToast(verifyState, {
    errorTitle: "Email verification failed",
  });
  useActionToast(resendState, {
    successTitle: "Verification code sent",
    errorTitle: "Could not resend code",
  });

  return (
    <div className="space-y-5">
      <form action={verifyFormAction} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={defaultEmail}
            autoComplete="email"
            aria-invalid={Boolean(verifyState.fieldErrors?.email)}
            className="h-10 rounded-md"
            required
          />
          <FieldError message={verifyState.fieldErrors?.email?.[0]} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Verification code</Label>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            aria-invalid={Boolean(verifyState.fieldErrors?.code)}
            className="h-10 rounded-md"
            required
          />
          <FieldError message={verifyState.fieldErrors?.code?.[0]} />
        </div>
        <SubmitButton pendingLabel="Verifying...">Verify email</SubmitButton>
      </form>

      <form action={resendFormAction} className="space-y-3">
        <input type="hidden" name="email" value={defaultEmail} />
        <Button type="submit" variant="outline" className="h-10 w-full rounded-md">
          Resend code
        </Button>
      </form>
    </div>
  );
}
