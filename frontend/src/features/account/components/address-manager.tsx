import type { AddressResponse } from "@cartura/contracts/addresses";
import { MapPinOff } from "lucide-react";

import { AddressCard } from "./address-card";
import { CreateAddressPanel } from "./create-address-panel";

export function AddressManager({ addresses }: { addresses: AddressResponse[] }) {
  return (
    <div className="mt-8 space-y-5">
      <CreateAddressPanel />
      {addresses.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {addresses.map((address) => (
            <AddressCard
              key={`${address.id}:${address.updatedAt}`}
              address={address}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/35 px-6 py-12 text-center">
          <MapPinOff className="mx-auto size-8 text-muted-foreground" strokeWidth={1.5} />
          <h2 className="mt-4 font-semibold">No saved addresses</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Add a delivery address above. You can save up to 20 addresses.
          </p>
        </div>
      )}
    </div>
  );
}
