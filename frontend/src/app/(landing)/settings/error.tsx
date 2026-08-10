"use client";

import { Button } from "@/shared/ui/button";

export default function SettingsError({ reset }: { reset: () => void }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
      <h1 className="text-xl font-semibold">Account details are unavailable</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        We could not load this part of your account. Try the request again.
      </p>
      <Button className="mt-5" onClick={reset}>Try again</Button>
    </div>
  );
}
