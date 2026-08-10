import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";

export function ManagementBackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted active:translate-y-px"
    >
      <ArrowLeft className="size-4" />
      {label}
    </Link>
  );
}

export function ManagementCreateLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/80 active:translate-y-px"
    >
      <Plus className="size-4" />
      {label}
    </Link>
  );
}

export function ManagementPermissionMessage({ permission }: { permission: string }) {
  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h1 className="text-2xl font-semibold">Access restricted</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Your account does not have the {permission} permission.
      </p>
    </section>
  );
}
