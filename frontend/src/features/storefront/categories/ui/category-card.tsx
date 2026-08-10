import Link from "next/link";

import type { StorefrontCategory } from "../api/categories-api";
import { CatalogMedia } from "../../shared/ui/catalog-media";

type CategoryCardProps = {
  category: StorefrontCategory;
  index?: number;
};

export function CategoryCard({ category, index = 0 }: CategoryCardProps) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group grid overflow-hidden rounded-lg border border-border bg-card transition duration-300 hover:-translate-y-1 hover:bg-background active:translate-y-px sm:grid-cols-[0.9fr_1.1fr]"
    >
      <CatalogMedia
        src={category.imageUrl}
        alt={category.name}
        fallbackIndex={index}
        className="aspect-4/3 rounded-none sm:aspect-auto"
        sizes="(min-width: 1024px) 28vw, 100vw"
      />
      <div className="flex min-h-56 flex-col justify-end p-5">
        <h3 className="text-2xl font-semibold tracking-[-0.04em]">
          {category.name}
        </h3>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
          {category.description ??
            "Browse products selected for this category."}
        </p>
        {category.children && category.children.length > 0 ? (
          <p className="mt-5 text-sm font-medium text-foreground">
            {category.children.length} subcategories
          </p>
        ) : null}
      </div>
    </Link>
  );
}
