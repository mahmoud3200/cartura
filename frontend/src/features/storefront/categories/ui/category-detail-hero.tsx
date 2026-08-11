import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import type { StorefrontCategory } from "../api/categories-api";
import { CatalogMedia } from "../../shared/ui/catalog-media";

type CategoryDetailHeroProps = {
  category: StorefrontCategory;
  productCount: number;
};

export function CategoryDetailHero({
  category,
  productCount,
}: CategoryDetailHeroProps) {
  return (
    <section className="relative isolate h-[clamp(22rem,33.333vw,30rem)] overflow-hidden bg-zinc-900 text-white">
      <CatalogMedia
        src={category.imageUrl}
        alt={category.name}
        priority
        className="absolute inset-0 rounded-none"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-zinc-950/15" />
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgb(9_9_11/94%)_0%,rgb(9_9_11/58%)_44%,rgb(9_9_11/18%)_100%)]" />

      <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-between px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <Link
          href="/categories"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-white/80 transition hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Categories
        </Link>

        <div className="max-w-4xl">
          <h1 className="line-clamp-2 text-balance text-4xl font-semibold tracking-tighter sm:text-6xl lg:text-7xl">
            {category.name}
          </h1>
          <p className="mt-4 line-clamp-2 max-w-2xl text-pretty text-base leading-7 text-white/78 sm:text-lg">
            {category.description ??
              "A focused category of active products from the Cartura catalog."}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/products"
              className="inline-flex h-10 items-center justify-center rounded-md bg-white px-4 text-sm font-medium text-zinc-950 transition hover:bg-white/90 active:translate-y-px"
            >
              Shop all
            </Link>
            <span className="text-sm text-white/72">
              {productCount} products
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
