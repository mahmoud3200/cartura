"use client";

import { Menu } from "@base-ui/react/menu";
import type { AuthUser } from "@cartura/contracts/auth";
import {
  ChevronDown,
  CircleUserRound,
  LayoutDashboard,
  LogOut,
  MapPin,
  ReceiptText,
  Settings,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import { logoutAction } from "@/features/auth/actions";
import { getInitials } from "@/shared/lib/person";

const accountLinks = [
  { label: "Account overview", href: "/settings", icon: Settings },
  { label: "Personal details", href: "/settings/profile", icon: CircleUserRound },
  { label: "Saved addresses", href: "/settings/addresses", icon: MapPin },
  { label: "Order history", href: "/settings/orders", icon: ReceiptText },
  { label: "Sign-in security", href: "/settings/security", icon: ShieldCheck },
];

export function AccountMenu({
  user,
  showDashboard = false,
}: {
  user: AuthUser;
  showDashboard?: boolean;
}) {
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`Open account menu for ${user.name}`}
        className="flex h-9 items-center gap-2 rounded-lg border border-transparent px-1.5 text-muted-foreground outline-none transition hover:border-border hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:border-border data-popup-open:bg-muted data-popup-open:text-foreground"
      >
        <span className="grid size-6 place-items-center rounded-md bg-primary text-[10px] font-semibold text-primary-foreground">
          {getInitials(user.firstName, user.lastName)}
        </span>
        <span className="hidden max-w-24 truncate text-xs font-medium sm:block">
          {user.firstName}
        </span>
        <ChevronDown className="size-3.5 transition-transform duration-200 data-[popup-open]:rotate-180" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={8} className="z-50 outline-none">
          <Menu.Popup className="w-[18rem] origin-top-right rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground),transparent_86%)] outline-none transition-[opacity,transform] duration-150 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0">
            <div className="px-3 py-3">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Menu.Separator className="my-1 h-px bg-border" />
            {showDashboard ? (
              <Menu.LinkItem
                render={<Link href="/dashboard" />}
                closeOnClick
                className="flex cursor-default items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none data-highlighted:bg-muted"
              >
                <LayoutDashboard
                  className="size-4 text-muted-foreground"
                  strokeWidth={1.8}
                />
                Dashboard
              </Menu.LinkItem>
            ) : null}
            {accountLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Menu.LinkItem
                  key={item.href}
                  render={<Link href={item.href} />}
                  closeOnClick
                  className="flex cursor-default items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none data-highlighted:bg-muted"
                >
                  <Icon className="size-4 text-muted-foreground" strokeWidth={1.8} />
                  {item.label}
                </Menu.LinkItem>
              );
            })}
            <Menu.Separator className="my-1 h-px bg-border" />
            <form action={logoutAction}>
              <Menu.Item
                nativeButton
                render={<button type="submit" />}
                className="flex w-full cursor-default items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-destructive outline-none data-highlighted:bg-destructive/10"
              >
                <LogOut className="size-4" strokeWidth={1.8} />
                Sign out
              </Menu.Item>
            </form>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
