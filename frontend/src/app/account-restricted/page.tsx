import { Suspense } from "react";

import { AccountRestrictionGate } from "@/features/auth/components/account-restriction-gate";
import { AccountRestrictedSkeleton } from "@/features/auth/ui/account-restricted-skeleton";

export default function AccountRestrictedPage() {
  return (
    <Suspense fallback={<AccountRestrictedSkeleton />}>
      <AccountRestrictionGate />
    </Suspense>
  );
}
