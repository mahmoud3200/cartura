import { SecurityOverview } from "@/features/account/components/security-overview";
import { AccountPageHeader } from "@/features/account/ui/account-page-header";
import { getCurrentAuthUser } from "@/features/auth/api/auth-api";

export default async function SecuritySettingsPage() {
  const user = await getCurrentAuthUser();

  if (!user) return null;

  return (
    <div>
      <AccountPageHeader
        title="Sign-in security"
        description="Review the protections currently attached to your customer account."
      />
      <SecurityOverview user={user} />
    </div>
  );
}
