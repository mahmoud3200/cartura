import Link from "next/link";
import { ArrowRight } from "lucide-react";

type CatalogEmptyStateProps = {
  title: string;
  description: string;
  href?: string;
  actionLabel?: string;
};

export function CatalogEmptyState({
  title,
  description,
  href,
  actionLabel,
}: CatalogEmptyStateProps) {
  return (
    <section className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
      <h2 className="text-2xl font-semibold tracking-[-0.03em]">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {href && actionLabel ? (
        <Link
          href={href}
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium"
        >
          {actionLabel}
          <ArrowRight className="size-4" />
        </Link>
      ) : null}
    </section>
  );
}
