import Link from "next/link";
import type { ReactNode } from "react";
import {
  formatStatus,
  getStatusClass,
  getDashboardErrorMessage,
} from "../lib/admin-utils";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-sm text-muted-foreground">Cartura management</p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight text-balance">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {action}
    </header>
  );
}

export function SeeAllLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition hover:bg-foreground hover:text-background active:translate-y-px"
    >
      See all
    </Link>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`w-fit rounded-sm px-2 py-1 text-xs ${getStatusClass(status)}`}
    >
      {formatStatus(status)}
    </span>
  );
}

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
      {label}
    </div>
  );
}

export function DashboardError({ error }: { error: unknown }) {
  const isForbidden =
    error instanceof Error &&
    "status" in error &&
    (error as Error & { status?: number }).status === 403;
  const message = getDashboardErrorMessage(error);

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h1 className="text-2xl font-semibold">
        {isForbidden ? "Access restricted" : "Page failed to load"}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        {isForbidden
          ? "Your account is signed in, but it does not have permission to read this management area."
          : message}
      </p>
    </section>
  );
}
