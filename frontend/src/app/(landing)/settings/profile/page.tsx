import { AccountPageHeader } from "@/features/account/ui/account-page-header";
import { ProfileForm } from "@/features/account/components/profile-form";
import { getCurrentAuthUser } from "@/features/auth/api/auth-api";

export default async function ProfileSettingsPage() {
  const user = await getCurrentAuthUser();

  if (!user) return null;

  return (
    <div>
      <AccountPageHeader
        title="Personal details"
        description="Update the name used across your Cartura account and future orders."
      />
      <ProfileForm user={user} />
    </div>
  );
}
