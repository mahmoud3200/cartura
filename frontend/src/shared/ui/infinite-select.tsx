"use client";

import { LoaderCircle, Search } from "lucide-react";
import type { RefCallback } from "react";

import { Input } from "@/shared/ui/input";
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

export type InfiniteSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type InfiniteSelectCommonProps = {
  options: InfiniteSelectOption[];
  search: string;
  onSearchChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyLabel: string;
  errorLabel: string;
  isLoading: boolean;
  isError: boolean;
  isLoadingMore: boolean;
  hasNextPage: boolean;
  loadMoreRef: RefCallback<HTMLDivElement>;
  id?: string;
  name?: string;
  className?: string;
};

export function InfiniteSelect({
  value,
  onValueChange,
  ...props
}: InfiniteSelectCommonProps & {
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <Select
      value={value || null}
      onValueChange={(nextValue) => onValueChange(nextValue ?? "")}
      items={props.options}
      name={props.name}
    >
      <InfiniteSelectTrigger
        value={value}
        options={props.options}
        placeholder={props.placeholder}
        id={props.id}
        className={props.className}
      />
      <InfiniteSelectMenu {...props} />
    </Select>
  );
}

export function InfiniteMultiSelect({
  value,
  onValueChange,
  ...props
}: InfiniteSelectCommonProps & {
  value: string[];
  onValueChange: (value: string[]) => void;
}) {
  return (
    <Select
      multiple
      value={value}
      onValueChange={onValueChange}
      items={props.options}
      name={props.name}
    >
      <SelectTrigger id={props.id} className={props.className}>
        <SelectValue>
          {() =>
            value.length
              ? `${value.length} ${value.length === 1 ? "category" : "categories"} selected`
              : props.placeholder
          }
        </SelectValue>
      </SelectTrigger>
      <InfiniteSelectMenu {...props} />
    </Select>
  );
}

function InfiniteSelectTrigger({
  value,
  options,
  placeholder,
  id,
  className,
}: {
  value: string;
  options: InfiniteSelectOption[];
  placeholder: string;
  id?: string;
  className?: string;
}) {
  const label = options.find((option) => option.value === value)?.label;

  return (
    <SelectTrigger id={id} className={className}>
      <SelectValue>{() => label ?? placeholder}</SelectValue>
    </SelectTrigger>
  );
}

function InfiniteSelectMenu({
  options,
  search,
  onSearchChange,
  searchPlaceholder,
  emptyLabel,
  errorLabel,
  isLoading,
  isError,
  isLoadingMore,
  hasNextPage,
  loadMoreRef,
}: InfiniteSelectCommonProps) {
  return (
    <SelectPortal>
      <SelectPositioner>
        <SelectPopup className="w-[min(var(--anchor-width),calc(100vw-1.5rem))]">
          <div className="relative border-b border-border p-2">
            <Search className="pointer-events-none absolute left-5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              onKeyDown={(event) => event.stopPropagation()}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="h-9 pl-9"
            />
          </div>
          <SelectList>
            {isLoading ? (
              <SelectMessage>
                <LoaderCircle className="size-4 animate-spin" />
                Loading options
              </SelectMessage>
            ) : isError ? (
              <SelectMessage>{errorLabel}</SelectMessage>
            ) : options.length === 0 ? (
              <SelectMessage>{emptyLabel}</SelectMessage>
            ) : (
              options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </SelectItem>
              ))
            )}
            {hasNextPage ? (
              <div ref={loadMoreRef} className="px-2 py-2">
                {isLoadingMore ? (
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <LoaderCircle className="size-3.5 animate-spin" />
                    Loading more
                  </span>
                ) : (
                  <span className="sr-only">More options load on scroll</span>
                )}
              </div>
            ) : null}
          </SelectList>
        </SelectPopup>
      </SelectPositioner>
    </SelectPortal>
  );
}

function SelectMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-2 px-3 py-8 text-center text-xs text-muted-foreground">
      {children}
    </div>
  );
}
