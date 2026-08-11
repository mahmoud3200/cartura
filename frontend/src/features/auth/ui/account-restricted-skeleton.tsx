export function AccountRestrictedSkeleton() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 py-12">
      <section className="w-full max-w-lg animate-pulse rounded-2xl border border-border bg-card p-6 sm:p-9">
        <div className="size-12 rounded-xl bg-muted" />
        <div className="mt-8 h-4 w-40 rounded bg-muted" />
        <div className="mt-4 h-20 rounded bg-muted" />
        <div className="mt-8 h-10 rounded bg-muted" />
      </section>
    </main>
  );
}
