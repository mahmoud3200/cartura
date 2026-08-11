import type { Category } from "@cartura/contracts/catalog";
import { ChevronDown, Sparkles } from "lucide-react";
import Link from "next/link";
import { storefrontHeaderLinks } from "./header-links";

const visibleCategoryCount = 6;
const navigationItems = storefrontHeaderLinks.slice(1);

export function StorefrontHeaderNavigation({
  categories,
}: {
  categories: Category[];
}) {
  const visibleCategories = categories.slice(0, visibleCategoryCount);
  const hasMoreCategories = categories.length > visibleCategoryCount;

  return (
    <nav className="hidden items-center gap-6 text-sm text-muted-foreground xl:flex">
      <div className="group relative">
        <Link
          href="/categories"
          className="inline-flex items-center gap-1.5 transition hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
          aria-haspopup="true"
        >
          Categories
          <ChevronDown className="size-3.5 transition group-hover:rotate-180 group-focus-within:rotate-180" />
        </Link>
        <div className="invisible absolute left-1/2 top-full z-40 w-72 -translate-x-1/2 pt-4 opacity-0 transition duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
          <div className="overflow-hidden rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-xl">
            {visibleCategories.length > 0 ? (
              visibleCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="block rounded-md px-3 py-2.5 transition hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                >
                  <span className="block text-sm font-medium text-foreground">
                    {category.name}
                  </span>
                  <span className="mt-0.5 line-clamp-1 block text-xs text-muted-foreground">
                    {category.description ??
                      `${category.children?.length ?? 0} subcategories`}
                  </span>
                </Link>
              ))
            ) : (
              <Link
                href="/categories"
                className="block rounded-md px-3 py-2.5 text-sm transition hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
              >
                Browse categories
              </Link>
            )}
            {hasMoreCategories ? (
              <Link
                href="/categories"
                className="mt-1 flex items-center justify-between rounded-md bg-foreground px-3 py-2.5 text-sm font-medium text-background transition hover:bg-foreground/88 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="size-3.5" />
                  More
                </span>
                <span className="text-xs text-background/70">
                  {categories.length - visibleCategoryCount}+
                </span>
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {navigationItems.map((item) => (
        <Link
          key={`${item.href}-${item.label}`}
          href={item.href}
          className="transition hover:text-foreground"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
