import { listAddresses } from "@/features/account/api/addresses-api";
import { AddressManager } from "@/features/account/components/address-manager";
import { AccountPageHeader } from "@/features/account/ui/account-page-header";

export default async function AddressSettingsPage() {
  const addresses = await listAddresses();

  return (
    <div>
      <AccountPageHeader
        title="Saved addresses"
        description="Add delivery destinations, edit contact details, and choose the address used by default at checkout."
      />
      <AddressManager addresses={addresses} />
    </div>
  );
}
