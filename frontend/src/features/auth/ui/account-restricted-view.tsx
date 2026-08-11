import type { AuthUser } from "@cartura/contracts/auth";
import { Ban, Clock3, LogOut } from "lucide-react";

import { Button } from "@/shared/ui/button";

export function AccountRestrictedView({
  user,
  signOutAction,
}: {
  user: AuthUser;
  signOutAction: () => Promise<void>;
}) {
  const isSuspended = user.accountStatus === "suspended";

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 py-12">
      <section className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 sm:p-9">
        <div className="grid size-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
          {isSuspended ? <Clock3 className="size-5" /> : <Ban className="size-5" />}
        </div>
        <p className="mt-8 text-sm font-medium text-muted-foreground">
          Account access restricted
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
          {isSuspended
            ? "Your account is temporarily suspended."
            : "Your account has been disabled."}
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {user.accountStatusReason ??
            "Contact Cartura support if you believe this restriction is incorrect."}
        </p>
        {isSuspended && user.suspendedUntil ? (
          <div className="mt-6 rounded-xl bg-muted px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground">
              Access is scheduled to return
            </p>
            <p className="mt-1 text-sm font-semibold">
              {new Intl.DateTimeFormat("en-EG", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(user.suspendedUntil))}
            </p>
          </div>
        ) : null}
        <form action={signOutAction} className="mt-8">
          <Button type="submit" variant="outline" className="w-full">
            <LogOut className="size-4" />
            Sign out
          </Button>
        </form>
      </section>
    </main>
  );
}
