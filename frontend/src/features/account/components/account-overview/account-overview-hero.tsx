import type { AuthUser } from "@cartura/contracts/auth";

import { getInitials } from "@/shared/lib/person";

export function AccountOverviewHero({ user }: { user: AuthUser }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card px-5 py-6 sm:px-9 sm:py-10">
      <div
        className="absolute -right-12 -top-16 size-56 rounded-full bg-accent/45 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative flex max-w-5xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-muted-foreground">
            Your account
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Everything is in one place, {user.firstName}.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            Review your details, delivery addresses, order activity, and sign-in
            protection.
          </p>
        </div>
        <div className="grid size-14 shrink-0 place-items-center rounded-xl border border-border bg-secondary text-base font-semibold text-secondary-foreground shadow-[0_18px_50px_color-mix(in_oklch,var(--secondary),transparent_72%)] sm:size-20 sm:rounded-2xl sm:text-xl">
          {getInitials(user.firstName, user.lastName)}
        </div>
      </div>
    </section>
  );
}
