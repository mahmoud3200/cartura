import { ArrowLeft, Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 py-12">
      <section className="w-full max-w-2xl">
        <p className="font-mono text-sm text-muted-foreground">404 / not found</p>
        <h1 className="mt-5 text-balance text-5xl font-semibold tracking-[-0.06em] sm:text-7xl">
          This page is not available.
        </h1>
        <p className="mt-5 max-w-xl text-pretty text-base leading-7 text-muted-foreground">
          The address may be incorrect, or you may not have access to this part
          of Cartura.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/85 active:translate-y-px"
          >
            <Home className="size-4" />
            Go to storefront
          </Link>
          <Link
            href="/products"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium transition hover:bg-muted active:translate-y-px"
          >
            <ArrowLeft className="size-4" />
            Browse products
          </Link>
        </div>
      </section>
    </main>
  );
}
