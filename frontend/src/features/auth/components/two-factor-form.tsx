"use client";

import { useActionState } from "react";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useActionToast } from "@/shared/hooks/use-action-toast";

import {
  sendTwoFactorOtpAction,
  verifyTwoFactorOtpAction,
  type AuthActionState,
} from "../actions";
import { FieldError } from "../ui/field-error";
import { SubmitButton } from "../ui/submit-button";

const initialState: AuthActionState = {
  ok: false,
};

export function TwoFactorForm() {
  const [sendState, sendFormAction] = useActionState(
    sendTwoFactorOtpAction,
    initialState,
  );
  const [verifyState, verifyFormAction] = useActionState(
    verifyTwoFactorOtpAction,
    initialState,
  );
  useActionToast(sendState, {
    successTitle: "Two-factor code sent",
    errorTitle: "Could not send code",
  });
  useActionToast(verifyState, {
    errorTitle: "Two-factor verification failed",
  });

  return (
    <div className="space-y-4">
      <form action={sendFormAction} className="space-y-3">
        <input type="hidden" name="trustDevice" value="on" />
        <Button type="submit" variant="outline" className="h-10 w-full rounded-md">
          Send two-factor code
        </Button>
      </form>

      <form action={verifyFormAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code">Two-factor code</Label>
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
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            name="trustDevice"
            className="size-4 rounded border-input accent-primary"
          />
          Trust this device
        </label>
        <SubmitButton pendingLabel="Verifying...">Verify code</SubmitButton>
      </form>
    </div>
  );
}
