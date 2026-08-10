"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  Select,
  SelectItem,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import type { CategoryFilterValues } from "../lib/category-filters";

type CategoryFiltersProps = {
  filters: CategoryFilterValues;
};

export function CategoryFilters({ filters }: CategoryFiltersProps) {
  const router = useRouter();
  const [query, setQuery] = useState(filters.q ?? "");
  const [level, setLevel] = useState(filters.level);

  return (
    <form
      action="/categories"
      method="get"
      className="grid gap-3 rounded-2xl border border-border bg-background p-4 sm:grid-cols-[minmax(0,1fr)_13rem_auto_auto] sm:items-end sm:p-5"
    >
      <label className="grid gap-2">
        <span className="text-xs font-medium text-muted-foreground">Find a category</span>
        <span className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search categories"
            className="h-11 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20"
          />
        </span>
      </label>
      <div className="grid gap-2">
        <span className="text-xs font-medium text-muted-foreground">Category level</span>
        <Select
          name="level"
          value={level}
          onValueChange={(value) => setLevel(value ?? "all")}
          items={[
            { value: "all", label: "All categories" },
            { value: "main", label: "Main categories" },
            { value: "subcategories", label: "Subcategories" },
          ]}
        >
          <SelectTrigger className="h-11 rounded-xl bg-card">
            <SelectValue>
              {() =>
                level === "main"
                  ? "Main categories"
                  : level === "subcategories"
                    ? "Subcategories"
                    : "All categories"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectPortal>
            <SelectPositioner>
              <SelectPopup>
                <SelectList>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="main">Main categories</SelectItem>
                  <SelectItem value="subcategories">Subcategories</SelectItem>
                </SelectList>
              </SelectPopup>
            </SelectPositioner>
          </SelectPortal>
        </Select>
      </div>
      <button
        type="submit"
        className="h-11 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/85 active:translate-y-px"
      >
        Apply filters
      </button>
      <button
        type="button"
        onClick={() => {
          setQuery("");
          setLevel("all");
          router.push("/categories");
        }}
        className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-border px-4 text-sm font-medium transition hover:bg-muted active:translate-y-px"
      >
        <X className="size-3.5" />
        Clear
      </button>
    </form>
  );
}
