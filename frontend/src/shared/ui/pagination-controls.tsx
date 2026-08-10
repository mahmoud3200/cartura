"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type PaginationMeta = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export function PaginationControls({
  pagination,
}: {
  pagination: PaginationMeta;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const from =
    pagination.totalItems === 0
      ? 0
      : (pagination.page - 1) * pagination.limit + 1;
  const to = Math.min(pagination.page * pagination.limit, pagination.totalItems);
  const pages = getVisiblePages(pagination.page, pagination.totalPages);

  if (pagination.totalPages <= 1 && pagination.totalItems <= pagination.limit) {
    return null;
  }

  const createHref = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    return `${pathname}?${params.toString()}`;
  };

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-muted-foreground">
        Showing <span className="font-medium text-foreground">{from}</span>-
        <span className="font-medium text-foreground">{to}</span> of{" "}
        <span className="font-medium text-foreground">
          {pagination.totalItems}
        </span>
      </p>

      <div className="flex flex-wrap items-center gap-1">
        <PaginationLink
          href={createHref(Math.max(1, pagination.page - 1))}
          disabled={!pagination.hasPreviousPage}
          label="Previous page"
        >
          <ChevronLeft className="size-4" />
          Previous
        </PaginationLink>

        {pages.map((page) => (
          <PaginationLink
            key={page}
            href={createHref(page)}
            active={page === pagination.page}
            label={`Page ${page}`}
          >
            {page}
          </PaginationLink>
        ))}

        <PaginationLink
          href={createHref(Math.min(pagination.totalPages, pagination.page + 1))}
          disabled={!pagination.hasNextPage}
          label="Next page"
        >
          Next
          <ChevronRight className="size-4" />
        </PaginationLink>
      </div>
    </nav>
  );
}

function PaginationLink({
  href,
  active,
  disabled,
  label,
  children,
}: {
  href: string;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: ReactNode;
}) {
  const className = cn(
    "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-md border border-border px-3 text-sm transition active:translate-y-px",
    active
      ? "bg-foreground text-background"
      : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
    disabled && "pointer-events-none opacity-45",
  );

  if (disabled) {
    return (
      <span aria-disabled="true" aria-label={label} className={className}>
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={className}
    >
      {children}
    </Link>
  );
}

function getVisiblePages(currentPage: number, totalPages: number) {
  const start = Math.max(1, currentPage - 1);
  const end = Math.min(totalPages, currentPage + 1);
  const pages: number[] = [];

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (!pages.includes(1)) pages.unshift(1);
  if (!pages.includes(totalPages)) pages.push(totalPages);

  return pages;
}
