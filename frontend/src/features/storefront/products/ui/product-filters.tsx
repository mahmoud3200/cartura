"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
} from "@/shared/ui/number-field";
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
import type { ProductFilterValues } from "../lib/product-filters";

type ProductFiltersProps = {
  filters: ProductFilterValues;
  action?: string;
};

export function ProductFilters({
  filters,
  action = "/products",
}: ProductFiltersProps) {
  const router = useRouter();
  const [query, setQuery] = useState(filters.q ?? "");
  const [availability, setAvailability] = useState(
    filters.inStock === undefined ? "" : String(filters.inStock),
  );
  const [minPrice, setMinPrice] = useState<number | null>(
    filters.minPrice ?? null,
  );
  const [maxPrice, setMaxPrice] = useState<number | null>(
    filters.maxPrice ?? null,
  );

  return (
    <form
      action={action}
      method="get"
      className="rounded-2xl border border-border bg-background p-4 shadow-[0_18px_50px_color-mix(in_oklch,var(--foreground)_6%,transparent)] sm:p-5"
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-primary" />
          <h2 className="font-semibold tracking-[-0.02em]">Filter products</h2>
        </div>
        <button
          type="button"
          onClick={clearFilters}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <X className="size-3.5" />
          Clear
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(16rem,2fr)_minmax(8rem,0.8fr)_minmax(8rem,0.8fr)_minmax(10rem,1fr)_auto] lg:items-end">
        <label className="grid min-w-0 gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Search
          </span>
          <span className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              name="q"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Products, SKUs, or categories"
              className="h-11 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20"
            />
          </span>
        </label>

        <PriceFilterField
          label="Min price"
          name="minPrice"
          value={minPrice}
          onValueChange={setMinPrice}
          placeholder="0"
          ariaLabel="Minimum price"
        />

        <PriceFilterField
          label="Max price"
          name="maxPrice"
          value={maxPrice}
          onValueChange={setMaxPrice}
          placeholder="Any"
          ariaLabel="Maximum price"
        />

        <div className="grid min-w-0 gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Availability
          </span>
          <Select
            name="inStock"
            value={availability || null}
            onValueChange={(value) => setAvailability(value ?? "")}
            items={[
              { value: "", label: "Any stock" },
              { value: "true", label: "In stock" },
              { value: "false", label: "Out of stock" },
            ]}
          >
            <SelectTrigger className="h-11 rounded-xl bg-card">
              <SelectValue>
                {() =>
                  availability === "true"
                    ? "In stock"
                    : availability === "false"
                      ? "Out of stock"
                      : "Any stock"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectPortal>
              <SelectPositioner>
                <SelectPopup>
                  <SelectList>
                    <SelectItem value="">Any stock</SelectItem>
                    <SelectItem value="true">In stock</SelectItem>
                    <SelectItem value="false">Out of stock</SelectItem>
                  </SelectList>
                </SelectPopup>
              </SelectPositioner>
            </SelectPortal>
          </Select>
        </div>

        <button
          type="submit"
          className="h-11 whitespace-nowrap rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/85 active:translate-y-px sm:col-span-2 lg:col-span-1"
        >
          Apply filters
        </button>
      </div>
    </form>
  );

  function clearFilters() {
    setQuery("");
    setAvailability("");
    setMinPrice(null);
    setMaxPrice(null);
    router.push(action);
  }
}

type PriceFilterFieldProps = {
  label: string;
  name: "minPrice" | "maxPrice";
  value: number | null;
  onValueChange: (value: number | null) => void;
  placeholder: string;
  ariaLabel: string;
};

function PriceFilterField({
  label,
  name,
  value,
  onValueChange,
  placeholder,
  ariaLabel,
}: PriceFilterFieldProps) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <NumberField
        className="min-w-0"
        name={name}
        min={0}
        step={0.01}
        value={value}
        onValueChange={onValueChange}
      >
        <NumberFieldGroup className="h-11 min-w-0">
          <NumberFieldInput
            inputMode="decimal"
            placeholder={placeholder}
            aria-label={ariaLabel}
            className="rounded-xl border border-input bg-card px-3 dark:bg-card"
          />
        </NumberFieldGroup>
      </NumberField>
    </label>
  );
}
