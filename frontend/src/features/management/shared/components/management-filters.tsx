"use client";

import { Search } from "lucide-react";
import { useState } from "react";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectItem,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectTrigger,
} from "@/shared/ui/select";

type FilterOption = {
  label: string;
  value: string;
};

type SelectFilter = {
  name: string;
  label: string;
  value?: string;
  options: readonly FilterOption[];
};

export function ManagementFilters({
  action,
  query,
  queryName = "q",
  queryPlaceholder = "Search",
  selects = [],
}: {
  action: string;
  query?: string;
  queryName?: string;
  queryPlaceholder?: string;
  selects?: readonly SelectFilter[];
}) {
  return (
    <form
      action={action}
      className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[minmax(12rem,1fr)_repeat(2,minmax(10rem,14rem))_auto]"
    >
      <ManagementSearchInput
        key={`${queryName}:${query ?? ""}`}
        name={queryName}
        value={query}
        placeholder={queryPlaceholder}
      />
      {selects.map((filter) => (
        <ManagementSelectFilter
          key={`${filter.name}:${filter.value ?? "all"}`}
          filter={filter}
        />
      ))}
      <Button type="submit" className="h-9 px-4">
        Apply
      </Button>
    </form>
  );
}

function ManagementSearchInput({
  name,
  value,
  placeholder,
}: {
  name: string;
  value?: string;
  placeholder: string;
}) {
  const [inputValue, setInputValue] = useState(value ?? "");

  return (
    <div className="relative min-w-0">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        name={name}
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 pl-8"
      />
    </div>
  );
}

function ManagementSelectFilter({ filter }: { filter: SelectFilter }) {
  const externalValue = filter.value ?? "all";
  const [value, setValue] = useState(externalValue);
  const selectedLabel =
    value === "all"
      ? `All ${filter.label}`
      : filter.options.find((option) => option.value === value)?.label ?? value;

  return (
    <Select
      name={filter.name}
      value={value}
      onValueChange={(nextValue) => {
        if (nextValue) setValue(nextValue);
      }}
    >
      <SelectTrigger className="h-9" aria-label={filter.label}>
        <span className="truncate">{selectedLabel}</span>
      </SelectTrigger>
      <SelectPortal>
        <SelectPositioner>
          <SelectPopup>
            <SelectList>
              <SelectItem value="all">All {filter.label}</SelectItem>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectList>
          </SelectPopup>
        </SelectPositioner>
      </SelectPortal>
    </Select>
  );
}
