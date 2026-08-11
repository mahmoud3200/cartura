import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ShoppingBag } from "lucide-react";

import { getCurrentAuthUser } from "@/features/auth/api/auth-api";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { listCurrentManagementPermissionNames } from "@/features/management/shared/api/management-permissions-api";
import { getManagementLandingPath } from "@/features/management/shared/lib/management-access";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 text-sm font-semibold">
          <span className="grid size-8 place-items-center rounded-md bg-foreground text-background">
            <ShoppingBag className="size-4" />
          </span>
          Cartura
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle className="border border-border bg-card" />
          <Link href="/" className="text-sm text-muted-foreground transition hover:text-foreground">
            Back to shop
          </Link>
        </div>
      </div>
      <Suspense fallback={null}>
        <AuthSessionGate>{children}</AuthSessionGate>
      </Suspense>
    </main>
  );
}

async function AuthSessionGate({ children }: { children: ReactNode }) {
  await connection();
  const user = await getCurrentAuthUser();

  if (user) {
    const permissionNames = await listCurrentManagementPermissionNames();
    redirect(getManagementLandingPath(permissionNames) ?? "/");
  }

  return children;
}
