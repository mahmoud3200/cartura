import { ChevronDown } from "lucide-react";

import { summarizePermissions } from "../lib/permission-summary";

export function CurrentPermissionsView({
  permissionNames,
}: {
  permissionNames: string[];
}) {
  const summaries = summarizePermissions(permissionNames);

  if (summaries.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No permissions are attached to this account.
      </p>
    );
  }

  return (
    <details className="rounded-lg border border-border/70 bg-background/60 px-4 py-3 [&[open]>summary>svg]:rotate-180">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span>Access · {permissionNames.length} permissions</span>
        <ChevronDown className="size-4 shrink-0 transition-transform duration-200" aria-hidden="true" />
      </summary>
      <div className="mt-4 grid gap-x-6 gap-y-3 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaries.map((summary) => (
          <div key={summary.group}>
            <p className="text-sm font-medium capitalize">{summary.title}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {summary.actions.join(" · ")}
            </p>
          </div>
        ))}
      </div>
    </details>
  );
}

export function CurrentPermissionsLoading() {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="h-5 w-48 animate-pulse rounded-md bg-muted" />
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    </section>
  );
}

export function CurrentPermissionsError() {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-lg font-semibold">Your permissions</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        We could not load the permission set for this session.
      </p>
    </section>
  );
}
