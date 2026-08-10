import type { ReactNode } from "react";
import Link from "next/link";
import { Home } from "lucide-react";

import { DashboardMobileNavigation } from "./dashboard-mobile-navigation";
import { DashboardSidebar } from "./dashboard-sidebar";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { NotificationCenter } from "@/features/notifications/components/notification-center";

type ManagementDashboardShellUser = {
  firstName: string;
  lastName: string;
  name: string;
};

export function ManagementDashboardShell({
  children,
  user,
  permissionNames,
}: {
  children: ReactNode;
  user: ManagementDashboardShellUser;
  permissionNames: string[];
}) {
  const initials =
    `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto grid min-h-svh w-full lg:grid-cols-[17rem_1fr]">
        <DashboardSidebar permissionNames={permissionNames} />

        <section className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                <Home className="size-4" />
                Storefront
              </Link>
              <DashboardMobileNavigation permissionNames={permissionNames} />
              <div className="flex items-center gap-3">
                <NotificationCenter />
                <ThemeToggle className="bg-transparent" />
                <div className="hidden text-right sm:block">
                  <p className="text-xs text-muted-foreground">Workspace</p>
                  <p className="text-sm font-medium">{user.name}</p>
                </div>
                <div className="grid size-9 place-items-center rounded-md bg-foreground text-sm font-semibold text-background">
                  {initials}
                </div>
              </div>
            </div>
          </header>

          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </section>
      </div>
    </main>
  );
}
