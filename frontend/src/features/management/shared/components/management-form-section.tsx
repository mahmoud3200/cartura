import type { ReactNode } from "react";

export function ManagementFormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <header className="border-b border-border p-4 sm:p-5">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}
