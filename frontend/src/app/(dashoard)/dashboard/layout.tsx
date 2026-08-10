import type { ReactNode } from "react";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import { DashboardShellLoadingSkeleton } from "@/features/management/shared/components/dashboard-loading-skeleton";
import { ManagementDashboardShell } from "@/features/management/shared/components/management-dashboard-shell";
import { getCurrentAuthUser } from "@/features/auth/api/auth-api";
import { listCurrentManagementPermissionNames } from "@/features/management/roles/api/roles-api";
import { hasManagementAccess } from "@/features/management/shared/lib/management-access";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<DashboardShellLoadingSkeleton />}>
      <DashboardSessionGate>{children}</DashboardSessionGate>
    </Suspense>
  );
}

async function DashboardSessionGate({ children }: { children: ReactNode }) {
  await connection();
  const user = await getCurrentAuthUser();

  if (!user) {
    redirect("/auth/login?redirect=/dashboard");
  }

  const permissionNames = await listCurrentManagementPermissionNames();

  if (!hasManagementAccess(permissionNames)) {
    notFound();
  }

  return (
    <ManagementDashboardShell user={user} permissionNames={permissionNames}>
      {children}
    </ManagementDashboardShell>
  );
}
