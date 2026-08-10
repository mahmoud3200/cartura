"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/shared/lib/utils";
import {
  canAccessManagementRoute,
  isManagementRouteActive,
} from "../lib/management-access";

const mobileNavItems = [
  { label: "Overview", href: "/dashboard" },
  { label: "Products", href: "/dashboard/products" },
  { label: "Categories", href: "/dashboard/categories" },
  { label: "Orders", href: "/dashboard/orders" },
  { label: "Users", href: "/dashboard/users" },
  { label: "Refunds", href: "/dashboard/refunds" },
  { label: "Payments", href: "/dashboard/payments" },
  { label: "Roles", href: "/dashboard/roles" },
  { label: "Audit", href: "/dashboard/audit" },
] as const;

export function DashboardMobileNavigation({
  permissionNames,
}: {
  permissionNames: string[];
}) {
  const pathname = usePathname();

  return (
    <nav
      className="mx-2 flex min-w-0 gap-2 overflow-x-auto px-2 scrollbar-none lg:hidden"
      aria-label="Dashboard navigation"
    >
      {mobileNavItems
        .filter((item) =>
          canAccessManagementRoute(item.href, permissionNames),
        )
        .map((item) => {
          const isActive = isManagementRouteActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors active:translate-y-px",
                isActive
                  ? "bg-foreground text-background"
                  : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
    </nav>
  );
}
