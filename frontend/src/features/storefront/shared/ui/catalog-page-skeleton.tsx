export function CatalogPageSkeleton() {
  return (
    <main aria-busy="true" aria-label="Loading catalog" className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-14 w-full max-w-2xl rounded-2xl bg-muted sm:h-20" />
        <div className="mt-5 h-6 w-full max-w-xl rounded-lg bg-muted" />
        <div className="mt-12 h-40 rounded-2xl border border-border bg-card" />
        <div className="mt-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="aspect-[4/5] rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    </main>
  );
}
