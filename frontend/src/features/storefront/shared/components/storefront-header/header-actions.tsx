"use client";

import type { AuthUser } from "@cartura/contracts/auth";
import { ShoppingCart, UserRound } from "lucide-react";
import Link from "next/link";

import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { useCartStore } from "@/shared/components/cart-store-provider";
import { NotificationCenter } from "@/features/notifications/components/notification-center";

import { StorefrontSearch } from "../../ui/storefront-search";
import { AccountMenu } from "./account-menu";
import { StorefrontMobileMenu } from "./storefront-mobile-menu";

export function StorefrontHeaderActions({
  user,
  showDashboard = false,
  initialCartItemCount = 0,
}: {
  user: AuthUser | null;
  showDashboard?: boolean;
  initialCartItemCount?: number;
}) {
  const storedCartItemCount = useCartStore((state) => state.cart?.itemCount);
  const cartItemCount = user
    ? (storedCartItemCount ?? initialCartItemCount)
    : 0;

  return (
    <div className="flex items-center gap-1.5">
      <StorefrontMobileMenu />
      <StorefrontSearch className="mr-1" />
      <ThemeToggle />
      {user ? (
        <>
          <NotificationCenter />
          <AccountMenu user={user} showDashboard={showDashboard} />
        </>
      ) : (
        <Link
          href="/auth/login?redirect=/settings"
          aria-label="Sign in"
          className="grid size-8 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <UserRound className="size-4" />
        </Link>
      )}
      <Link
        href={user ? "/cart" : "/auth/login?redirect=/cart"}
        aria-label="Cart"
        className="relative grid size-8 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <ShoppingCart className="size-4" />
        {cartItemCount > 0 ? (
          <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground">
            {cartItemCount > 99 ? "99+" : cartItemCount}
          </span>
        ) : null}
      </Link>
    </div>
  );
}
