import { KeyRound, ShieldCheck } from "lucide-react";

import { EmptyState } from "@/features/management/shared/components/admin-ui";
import { groupPermissionNames } from "../lib/role-form";

export function CurrentPermissionsView({
  permissionNames,
}: {
  permissionNames: string[];
}) {
  const groups = groupPermissionNames(permissionNames);

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-md bg-secondary text-secondary-foreground">
              <ShieldCheck className="size-4" />
            </span>
            <h2 className="text-lg font-semibold">Your permissions</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Current access for this dashboard session.
          </p>
        </div>
        <div className="rounded-md bg-secondary px-3 py-2 font-mono text-sm text-secondary-foreground">
          {permissionNames.length} granted
        </div>
      </header>
      <div className="p-4">
        {permissionNames.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {groups.map(([group, items]) => (
              <article
                key={group}
                className="rounded-md border border-border bg-background p-4"
              >
                <div className="flex items-center gap-2">
                  <KeyRound className="size-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold capitalize">{group}</h3>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {items.map((item) => (
                    <span
                      key={item.name}
                      className="rounded-sm bg-secondary px-2 py-1 font-mono text-[11px] text-secondary-foreground"
                    >
                      {item.label}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState label="No permissions are attached to this account." />
        )}
      </div>
    </section>
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
