"use client";

import { ChevronRight, Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverPositioner,
  PopoverTrigger,
} from "@/shared/ui/popover";

import { storefrontHeaderLinks } from "./header-links";

export function StorefrontMobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={open ? "Close menu" : "Open menu"}
        className="group size-9 xl:hidden"
      >
        <Menu className="size-4 group-data-[popup-open]:hidden" />
        <X className="hidden size-4 group-data-[popup-open]:block" />
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverPositioner align="end" sideOffset={10} collisionPadding={16}>
          <PopoverContent className="max-h-[calc(100dvh-5rem)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto p-2 xl:hidden">
            <form
              action="/products"
              method="get"
              role="search"
              className="rounded-lg bg-muted/65 p-3"
            >
              <label
                className="block text-sm font-medium"
                htmlFor="mobile-product-search"
              >
                Search products
              </label>
              <div className="mt-2 flex min-w-0 gap-2">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="mobile-product-search"
                    type="search"
                    name="q"
                    placeholder="What are you looking for?"
                    className="h-10 w-full min-w-0 rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px"
                >
                  Search
                </button>
              </div>
            </form>

            <nav aria-label="Mobile navigation" className="mt-2">
              {storefrontHeaderLinks.map((item) => (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  {item.label}
                  <ChevronRight
                    aria-hidden="true"
                    className="size-4 text-muted-foreground"
                  />
                </Link>
              ))}
            </nav>
          </PopoverContent>
        </PopoverPositioner>
      </PopoverPortal>
    </Popover>
  );
}
