export function ProductDetailSkeleton() {
  return (
    <main className="min-h-[70dvh] animate-pulse px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
        <div className="aspect-[4/5] rounded-xl bg-muted" />
        <div className="h-[32rem] rounded-xl bg-muted" />
      </div>
    </main>
  );
}
