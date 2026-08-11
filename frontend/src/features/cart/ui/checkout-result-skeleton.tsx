export function CheckoutResultSkeleton() {
  return (
    <main className="flex min-h-[70dvh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md animate-pulse rounded-2xl border border-border bg-card p-8">
        <div className="mx-auto mb-6 size-18 rounded-full bg-muted" />
        <div className="mx-auto mb-3 h-7 w-52 rounded bg-muted" />
        <div className="mx-auto h-4 w-72 max-w-full rounded bg-muted" />
      </div>
    </main>
  );
}
