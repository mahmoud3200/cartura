import { Search } from "lucide-react";

import { cn } from "@/shared/lib/utils";

type StorefrontSearchProps = {
  className?: string;
};

export function StorefrontSearch({ className }: StorefrontSearchProps) {
  return (
    <form
      action="/products"
      method="get"
      role="search"
      className={cn("hidden xl:block", className)}
    >
      <label className="relative block">
        <span className="sr-only">Search all products</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          name="q"
          placeholder="Search products"
          className="h-10 w-56 rounded-xl border border-border bg-card/80 pl-9 pr-3 text-sm outline-none transition placeholder:text-muted-foreground hover:border-foreground/20 focus:border-ring focus:ring-3 focus:ring-ring/20 xl:w-64"
        />
      </label>
    </form>
  );
}
