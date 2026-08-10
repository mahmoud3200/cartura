import type { ReactNode } from "react";

import { Skeleton } from "@/shared/ui/skeleton";

const metricCards = [
  "revenue",
  "orders",
  "users",
  "return-queue",
  "payment-issues",
];
const overviewSections = ["recent-orders", "revenue", "statuses"];

export function DashboardLoadingSkeleton() {
  return (
    <LoadingRegion label="Loading dashboard overview">
      <HeaderSkeleton />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.25fr_repeat(4,minmax(0,1fr))]">
        {metricCards.map((item) => (
          <article
            key={item}
            className="rounded-lg border border-border bg-card p-5"
          >
            <div className="mb-7 flex items-center justify-between">
              <Skeleton className="size-5" />
              <Skeleton className="size-2 rounded-full" />
            </div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-9 w-32" />
            <Skeleton className="mt-4 h-4 w-full" />
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {overviewSections.map((section) => (
          <div key={section} className="rounded-lg border border-border bg-card">
            <div className="border-b border-border p-4">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="mt-2 h-4 w-52 max-w-full" />
            </div>
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          </div>
        ))}
      </section>
    </LoadingRegion>
  );
}

export function ManagementTablePageSkeleton({
  columns = 5,
  rows = 7,
  filterCount = 1,
  showFormPanel = false,
}: {
  columns?: number;
  rows?: number;
  filterCount?: number;
  showFormPanel?: boolean;
}) {
  const gridTemplateColumns = `repeat(${columns}, minmax(7rem, 1fr))`;

  return (
    <LoadingRegion label="Loading management page">
      <HeaderSkeleton action />

      {showFormPanel ? (
        <section className="rounded-lg border border-border bg-card p-4">
          <Skeleton className="h-5 w-32" />
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-24" />
          </div>
        </section>
      ) : null}

      <section className="rounded-lg border border-border bg-card p-4">
        <div
          className={
            filterCount === 3
              ? "grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(15rem,1.4fr)_repeat(3,minmax(10rem,0.75fr))_auto]"
              : "grid gap-3 sm:grid-cols-[minmax(12rem,1fr)_repeat(2,minmax(10rem,14rem))_auto]"
          }
        >
          <Skeleton className="h-9 w-full" />
          {Array.from({ length: filterCount }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
          <Skeleton className="h-9 w-20" />
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-hidden">
          <div
            className="grid min-w-[720px] gap-4 border-b border-border px-4 py-3"
            style={{ gridTemplateColumns }}
          >
            {Array.from({ length: columns }).map((_, index) => (
              <Skeleton key={index} className="h-3 w-16" />
            ))}
          </div>
          <div className="min-w-[720px] divide-y divide-border">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <div
                key={rowIndex}
                className="grid items-center gap-4 px-4 py-4"
                style={{ gridTemplateColumns }}
              >
                {Array.from({ length: columns }).map((_, columnIndex) => (
                  <Skeleton
                    key={columnIndex}
                    className={
                      columnIndex === columns - 1
                        ? "ml-auto h-8 w-8"
                        : "h-4 w-3/4"
                    }
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </LoadingRegion>
  );
}

export function ManagementFormPageSkeleton() {
  return (
    <LoadingRegion label="Loading management form">
      <HeaderSkeleton action />
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.7fr)]">
        <div className="space-y-5 rounded-lg border border-border bg-card p-5">
          <Skeleton className="h-5 w-40" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
          <Skeleton className="h-28 w-full" />
        </div>
        <div className="space-y-5 rounded-lg border border-border bg-card p-5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </section>
    </LoadingRegion>
  );
}

export function DashboardShellLoadingSkeleton() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto grid min-h-svh w-full lg:grid-cols-[17rem_1fr]">
        <aside className="hidden border-r border-border bg-background px-4 py-5 lg:block">
          <div className="flex items-center gap-2.5 px-2">
            <Skeleton className="size-9" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="mt-8 space-y-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        </aside>
        <section className="min-w-0">
          <header className="h-16 border-b border-border bg-background px-4 sm:px-6 lg:px-8">
            <div className="flex h-full items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <div className="flex items-center gap-3">
                <Skeleton className="size-9" />
                <Skeleton className="size-9" />
              </div>
            </div>
          </header>
          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <DashboardLoadingSkeleton />
          </div>
        </section>
      </div>
    </main>
  );
}

function HeaderSkeleton({ action = false }: { action?: boolean }) {
  return (
    <section className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-5">
      <div className="min-w-0 flex-1">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-4 h-9 w-full max-w-xl" />
        <Skeleton className="mt-3 h-4 w-full max-w-sm" />
      </div>
      {action ? <Skeleton className="h-9 w-28 shrink-0" /> : null}
    </section>
  );
}

function LoadingRegion({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-5" role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
