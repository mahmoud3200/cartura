import type { Product } from "@cartura/contracts/catalog";
import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, PackageCheck, Search, UserRound } from "lucide-react";
import { cacheLife, cacheTag } from "next/cache";

import {
  benefits,
  styleEdit,
} from "@/features/storefront/home/data/storefront-content";
import { listStorefrontProducts } from "../../products/api/products-api";
import { ProductCard } from "../../products/ui/product-card";
import { CatalogEmptyState } from "../../shared/ui/catalog-empty-state";

const benefitIcons = [PackageCheck, Search, UserRound];

type ProductShowcaseProps = {
  products: Product[];
  isUnavailable?: boolean;
};

export async function CachedProductShowcase() {
  "use cache";

  cacheLife("hours");
  cacheTag("catalog:products", "storefront:home:products");

  const productsResult = await listStorefrontProducts({ limit: 4 })
    .then((products) => ({ products: products.data, isUnavailable: false }))
    .catch(() => ({ products: [], isUnavailable: true }));

  return (
    <ProductShowcase
      products={productsResult.products}
      isUnavailable={productsResult.isUnavailable}
    />
  );
}

export function ProductShowcase({
  products,
  isUnavailable = false,
}: ProductShowcaseProps) {
  return (
    <>
      <section
        id="new-arrivals"
        className="border-y border-border bg-card px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <h2 className="text-balance text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
                New arrivals worth wearing on repeat.
              </h2>
              <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-muted-foreground">
                Fresh clothing and accessories, with the details you need to
                choose what fits your style.
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/85 active:translate-y-px"
            >
              See all products
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div
            id="shop"
            className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            {products.map((product, index) => (
              <div
                key={product.id}
                className="reveal"
                style={{ "--index": index } as CSSProperties}
              >
                <ProductCard product={product} index={index} />
              </div>
            ))}
          </div>

          {isUnavailable ? (
            <div className="mt-10">
              <CatalogEmptyState
                title="Products are temporarily unavailable"
                description="The storefront will refresh from the API when the cached catalog is updated."
              />
            </div>
          ) : products.length === 0 ? (
            <div className="mt-10">
              <CatalogEmptyState
                title="No products are published yet"
                description="Active products from the API will appear here when the cached catalog is updated."
                href="/categories"
                actionLabel="View categories"
              />
            </div>
          ) : null}
        </div>
      </section>

      <section
        id="about-us"
        className="px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-4xl">
            <h2 className="text-balance text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
              Clothes first. Details that finish the look.
            </h2>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-muted-foreground">
              Cartura brings everyday layers and understated accessories into
              one straightforward place to shop.
            </p>
          </div>
          <div className="mt-12 grid gap-3 lg:grid-cols-[1.25fr_0.9fr_0.85fr]">
            {benefits.map((benefit, index) => {
              const Icon = benefitIcons[index] ?? PackageCheck;

              return (
                <article
                  key={benefit.title}
                  className="rounded-lg border border-border bg-card p-6"
                >
                  <Icon className="mb-10 size-5 text-muted-foreground" />
                  <h3 className="text-xl font-semibold tracking-[-0.03em]">
                    {benefit.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {benefit.text}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="style-edit"
        className="px-4 pb-24 sm:px-6 lg:px-8 lg:pb-32"
      >
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-lg border border-border bg-card text-card-foreground lg:grid-cols-[0.95fr_1.05fr]">
          <div
            role="img"
            aria-label="Charcoal clothing, a cap, a silver chain, and rings arranged together"
            className="min-h-[24rem] bg-cover bg-center"
            style={{ backgroundImage: "url(/visuals/cartura-style-edit.png)" }}
          />
          <div className="flex flex-col justify-center p-6 sm:p-10">
            <p className="text-sm text-muted-foreground">Wear it together</p>
            <h2 className="mt-5 max-w-2xl text-balance text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
              {styleEdit.title}
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground">
              {styleEdit.text}
            </p>
            <Link
              href={styleEdit.href}
              className="mt-8 inline-flex items-center gap-2 text-sm font-medium"
            >
              {styleEdit.cta}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
