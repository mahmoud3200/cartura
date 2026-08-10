import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { getCurrentAuthUser } from "@/features/auth/api/auth-api";
import { AccountShell } from "@/features/account/components/account-shell";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<AccountLayoutLoading />}>
      <AuthenticatedAccountShell>{children}</AuthenticatedAccountShell>
    </Suspense>
  );
}

async function AuthenticatedAccountShell({ children }: { children: ReactNode }) {
  await connection();
  const user = await getCurrentAuthUser();

  if (!user) {
    redirect("/auth/login?redirect=/settings");
  }

  return <AccountShell user={user}>{children}</AccountShell>;
}

function AccountLayoutLoading() {
  return (
    <main className="min-h-[70dvh] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl animate-pulse gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
        <div className="h-[4.5rem] rounded-xl bg-muted lg:h-56" />
        <div className="space-y-5">
          <div className="h-12 w-64 rounded-lg bg-muted" />
          <div className="h-5 w-full max-w-xl rounded bg-muted" />
          <div className="h-72 rounded-xl bg-muted" />
        </div>
      </div>
    </main>
  );
}
