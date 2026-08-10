import type { AuthUser } from "@cartura/contracts/auth";
import type { ReactNode } from "react";

import { getInitials } from "../lib/account-formatters";
import { AccountNavigation } from "../ui/account-navigation";

export function AccountShell({
  user,
  children,
}: {
  user: AuthUser;
  children: ReactNode;
}) {
  return (
    <main className="min-h-[70dvh] w-full bg-background px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
      <div className="mx-auto grid w-full max-w-7xl gap-5 sm:gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
        <aside className="sticky top-16 z-10 -mx-4 min-w-0 border-b border-border bg-background/95 px-4 py-3 backdrop-blur lg:top-24 lg:mx-0 lg:self-start lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <div className="mb-5 hidden items-center gap-3 border-b border-border pb-5 lg:flex">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-sm font-semibold text-secondary-foreground">
              {getInitials(user.firstName, user.lastName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <AccountNavigation />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}
