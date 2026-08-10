"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  ChevronDown,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Package,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Tags,
  Users,
} from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { useCatalogTree } from "../hooks/use-catalog-tree";
import {
  canAccessManagementRoute,
  isManagementRouteActive,
} from "../lib/management-access";

type NavigationLeaf = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type NavigationGroup = {
  label: string;
  icon: LucideIcon;
  children: NavigationLeaf[];
};

type NavigationItem = NavigationLeaf | NavigationGroup;

const navItems: NavigationItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Catalog",
    icon: Boxes,
    children: [
      { label: "Products", href: "/dashboard/products", icon: Package },
      { label: "Categories", href: "/dashboard/categories", icon: Tags },
    ],
  },
  { label: "Orders", href: "/dashboard/orders", icon: ReceiptText },
  { label: "Users", href: "/dashboard/users", icon: Users },
  { label: "Refunds", href: "/dashboard/refunds", icon: RotateCcw },
  { label: "Payments", href: "/dashboard/payments", icon: CreditCard },
  { label: "Roles", href: "/dashboard/roles", icon: ShieldCheck },
  { label: "Audit", href: "/dashboard/audit", icon: ClipboardList },
];

export function DashboardSidebar({ permissionNames }: { permissionNames: string[] }) {
  const { pathname, catalogOpen, toggleCatalog } = useCatalogTree();
  const visibleItems = navItems.reduce<NavigationItem[]>((items, item) => {
    if ("children" in item) {
      const children = item.children.filter((child) =>
        canAccessManagementRoute(child.href, permissionNames),
      );

      if (children.length) {
        items.push({ ...item, children });
      }

      return items;
    }

    if (canAccessManagementRoute(item.href, permissionNames)) {
      items.push(item);
    }

    return items;
  }, []);

  return (
    <aside className="hidden border-r border-border bg-background/72 px-4 py-5 lg:block">
      <div className="sticky top-5 flex h-[calc(100svh-2.5rem)] flex-col">
        <div className="flex items-center gap-2.5 px-2">
          <span className="grid size-9 place-items-center rounded-md bg-foreground text-background">
            <ShoppingBag className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">Cartura</p>
            <p className="text-xs text-muted-foreground">Management</p>
          </div>
        </div>

        <nav className="mt-8 space-y-1" aria-label="Dashboard navigation">
          {visibleItems.map((item) => {
            const Icon = item.icon;

            if ("children" in item) {
              const isActive = item.children.some(
                (child) => isManagementRouteActive(pathname, child.href),
              );

              return (
                <div key={item.label}>
                  <button
                    type="button"
                    className={navLinkClass(isActive, "w-full")}
                    onClick={toggleCatalog}
                    aria-expanded={catalogOpen}
                    aria-controls="catalog-navigation"
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                    <ChevronDown
                      className={cn(
                        "ml-auto size-4 transition-transform",
                        catalogOpen && "rotate-180",
                      )}
                    />
                  </button>
                  {catalogOpen ? (
                    <div
                      id="catalog-navigation"
                      className="ml-5 mt-1 space-y-1 border-l border-border pl-3"
                    >
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const childActive = isManagementRouteActive(
                          pathname,
                          child.href,
                        );

                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            aria-current={childActive ? "page" : undefined}
                            className={navLinkClass(childActive, "h-9 text-xs")}
                          >
                            <ChildIcon className="size-3.5" />
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            }

            const isActive = isManagementRouteActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={navLinkClass(isActive)}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

function navLinkClass(active: boolean, className?: string) {
  return cn(
    "flex h-10 items-center gap-3 rounded-md px-3 text-sm transition active:translate-y-px",
    active
      ? "bg-foreground text-background"
      : "text-muted-foreground hover:bg-card hover:text-foreground",
    className,
  );
}
