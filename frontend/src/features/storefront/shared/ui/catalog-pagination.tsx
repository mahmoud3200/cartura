import type { PaginationResponse } from "@cartura/contracts/catalog";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

type CatalogPaginationProps = {
  pagination?: PaginationResponse;
  pathname: string;
  params: Record<string, string | number | boolean | undefined>;
};

export function CatalogPagination({
  pagination,
  pathname,
  params,
}: CatalogPaginationProps) {
  if (!pagination || pagination.totalPages <= 1) return null;

  return (
    <nav
      aria-label="Catalog pagination"
      className="mt-12 flex items-center justify-between gap-4 border-t border-border pt-6"
    >
      {pagination.hasPreviousPage ? (
        <Link
          href={buildPageHref(pathname, params, pagination.page - 1)}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-medium transition hover:bg-muted active:translate-y-px"
        >
          <ArrowLeft className="size-4" />
          Previous
        </Link>
      ) : (
        <span />
      )}
      <p className="text-sm text-muted-foreground">
        Page <span className="font-medium text-foreground">{pagination.page}</span> of {pagination.totalPages}
      </p>
      {pagination.hasNextPage ? (
        <Link
          href={buildPageHref(pathname, params, pagination.page + 1)}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-medium transition hover:bg-muted active:translate-y-px"
        >
          Next
          <ArrowRight className="size-4" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

function buildPageHref(
  pathname: string,
  params: CatalogPaginationProps["params"],
  page: number,
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries({ ...params, page })) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  return `${pathname}?${searchParams.toString()}`;
}
