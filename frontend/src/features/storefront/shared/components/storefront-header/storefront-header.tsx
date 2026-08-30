import type { AuthUser } from "@cartura/contracts/auth";
import type { Cart } from "@cartura/contracts/cart";
import type { Category } from "@cartura/contracts/catalog";

import { getCurrentAuthUser } from "@/features/auth/api/auth-api";
import { getCustomerCart } from "@/features/cart/api/cart-api";
import { listCurrentManagementPermissionNames } from "@/features/management/shared/api/management-permissions-api";
import { hasManagementAccess } from "@/features/management/shared/lib/management-access";
import { CartStoreHydrator } from "@/shared/components/cart-store-hydrator";

import { listStorefrontCategories } from "../../../categories/api/categories-api";
import { StorefrontHeaderActions } from "./header-actions";
import { StorefrontHeaderBrand } from "./header-brand";
import { StorefrontHeaderNavigation } from "./header-navigation";

type StorefrontHeaderProps = {
  categories?: Category[];
  user?: AuthUser | null;
  cart?: Cart | null;
  showDashboard?: boolean;
};

export async function CachedStorefrontHeader() {
  const [categories, user] = await Promise.all([
    listStorefrontCategories().catch(() => []),
    getCurrentAuthUser(),
  ]);
  const [cart, permissionNames] = user
    ? await Promise.all([
        getCustomerCart().catch(() => null),
        listCurrentManagementPermissionNames().catch(() => []),
      ])
    : [null, []];

  return (
    <StorefrontHeader
      categories={categories}
      user={user}
      cart={cart}
      showDashboard={hasManagementAccess(permissionNames)}
    />
  );
}

export function StorefrontHeader({
  categories = [],
  user = null,
  cart,
  showDashboard = false,
}: StorefrontHeaderProps) {
  return (
    <>
      {cart !== undefined ? <CartStoreHydrator cart={cart} /> : null}
      <header className="fixed top-0 z-30 w-full border-b border-foreground/10 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <StorefrontHeaderBrand />
          <StorefrontHeaderNavigation categories={categories} />
          <StorefrontHeaderActions
            user={user}
            showDashboard={showDashboard}
            initialCartItemCount={cart?.itemCount ?? 0}
          />
        </div>
      </header>
    </>
  );
}
