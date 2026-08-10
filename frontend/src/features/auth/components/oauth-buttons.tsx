"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/shared/ui/button";

import { startGoogleOAuth } from "../api/oauth-client";
import { createOAuthRedirectUrls } from "../lib/auth-redirects";
import { getOAuthErrorMessage } from "../lib/oauth-errors";

type OAuthButtonsProps = {
  flow: "login" | "register";
  redirectTo?: string;
  error?: string;
  errorDescription?: string;
};

export function OAuthButtons({
  flow,
  redirectTo = "/",
  error,
  errorDescription,
}: OAuthButtonsProps) {
  const [isPending, setIsPending] = useState(false);
  const [startFailed, setStartFailed] = useState(false);
  const visibleError = startFailed ? "failed" : error;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setStartFailed(false);

    try {
      const destination = await startGoogleOAuth({
        provider: "google",
        ...createOAuthRedirectUrls({
          frontendUrl: window.location.origin,
          redirectTo,
          flow,
        }),
      });

      window.location.assign(destination);
    } catch {
      setStartFailed(true);
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or continue with
        <span className="h-px flex-1 bg-border" />
      </div>
      {visibleError ? (
        <p role="alert" className="text-center text-sm text-destructive">
          {getOAuthErrorMessage(visibleError, errorDescription)}
        </p>
      ) : null}
      <form onSubmit={handleSubmit}>
        <input type="hidden" name="flow" value={flow} />
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <Button
          type="submit"
          variant="outline"
          className="h-10 w-full rounded-md"
          disabled={isPending}
        >
          <span aria-hidden="true" className="text-base font-semibold">G</span>
          {isPending ? "Opening Google..." : "Continue with Google"}
        </Button>
      </form>
    </div>
  );
}
