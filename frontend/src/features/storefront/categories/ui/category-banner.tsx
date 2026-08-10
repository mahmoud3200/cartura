import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import type { StorefrontCategory } from "../api/categories-api";
import { CatalogMedia } from "../../shared/ui/catalog-media";

type CategoryBannerProps = {
  category: StorefrontCategory;
  index: number;
  className?: string;
};

export function CategoryBanner({
  category,
  index,
  className,
}: CategoryBannerProps) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className={cn(
        "group relative isolate block min-h-64 overflow-hidden rounded-2xl border border-white/15 bg-card text-white shadow-[0_18px_50px_rgb(20_30_25/12%)] transition duration-300 hover:-translate-y-1 active:translate-y-px",
        className,
      )}
    >
      <CatalogMedia
        src={category.imageUrl}
        alt={category.name}
        fallbackIndex={index}
        className="absolute inset-0 rounded-none"
        sizes="(min-width: 1024px) 55vw, 100vw"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_20%,rgb(9_15_13/84%)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-6">
        <div>
          <h3 className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
            {category.name}
          </h3>
          {category.description ? (
            <p className="mt-2 line-clamp-2 max-w-md text-sm leading-6 text-white/72">
              {category.description}
            </p>
          ) : null}
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-zinc-950 transition duration-300 group-hover:rotate-6 group-hover:scale-105">
          <ArrowUpRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}
