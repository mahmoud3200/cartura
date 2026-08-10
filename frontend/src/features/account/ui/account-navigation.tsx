"use client";

import {
  CircleUserRound,
  House,
  MapPin,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/shared/lib/utils";

const items = [
  { label: "Overview", href: "/settings", icon: House, exact: true },
  { label: "Profile", href: "/settings/profile", icon: CircleUserRound },
  { label: "Addresses", href: "/settings/addresses", icon: MapPin },
  { label: "Orders", href: "/settings/orders", icon: ReceiptText },
  { label: "Security", href: "/settings/security", icon: ShieldCheck },
];

export function AccountNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account settings">
      <div className="grid grid-cols-5 gap-1 lg:hidden">
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-[0.6875rem] font-medium transition-colors active:translate-y-px sm:min-h-11 sm:flex-row sm:gap-2 sm:px-2 sm:text-sm",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" strokeWidth={1.8} />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="hidden gap-1 lg:flex lg:flex-col">
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition active:translate-y-px",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" strokeWidth={1.8} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
