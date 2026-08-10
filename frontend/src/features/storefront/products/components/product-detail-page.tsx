import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ProductPurchaseActions } from "@/features/cart/components/product-purchase-actions";
import type { StorefrontProduct } from "../api/products-api";
import { ProductCard, formatPrice } from "../ui/product-card";
import { CatalogMedia } from "../../shared/ui/catalog-media";
import type { AddressResponse } from "@cartura/contracts/addresses";

type ProductDetailPageProps = {
  product: StorefrontProduct;
  relatedProducts: StorefrontProduct[];
  isAuthenticated: boolean;
  addresses?: AddressResponse[];
};

export function ProductDetailPage({
  product,
  relatedProducts,
  isAuthenticated,
  addresses,
}: ProductDetailPageProps) {
  const primaryImage = product.images[0];
  const secondaryImages = product.images.slice(1, 5);
  const category = product.categories[0];

  return (
    <main>
      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Products
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="grid gap-3 sm:grid-cols-2">
              <CatalogMedia
                src={primaryImage?.imageUrl}
                alt={primaryImage?.altText ?? product.name}
                priority
                className="aspect-[4/5] sm:col-span-2"
                sizes="(min-width: 1024px) 55vw, 100vw"
              />
              {secondaryImages.map((image, index) => (
                <CatalogMedia
                  key={image.mediaAssetId}
                  src={image.imageUrl}
                  alt={image.altText ?? product.name}
                  fallbackIndex={index + 1}
                  className="aspect-[4/3]"
                  sizes="(min-width: 1024px) 27vw, 50vw"
                />
              ))}
            </div>

            <div className="lg:sticky lg:top-24">
              <div className="rounded-lg border border-border bg-card p-6 sm:p-8">
                {category ? (
                  <Link
                    href={`/categories/${category.slug}`}
                    className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
                  >
                    {category.name}
                  </Link>
                ) : null}
                <h1 className="mt-3 text-balance text-5xl font-semibold tracking-[-0.05em] sm:text-6xl">
                  {product.name}
                </h1>
                <p className="mt-5 font-mono text-xl">
                  {formatPrice(product.price)}
                </p>
                <p className="mt-6 text-sm leading-6 text-muted-foreground">
                  {product.description ??
                    "A current Cartura catalog item prepared for public storefront browsing."}
                </p>

                <div className="mt-8 grid gap-3 text-sm">
                  <div className="flex justify-between gap-4 border-t border-border pt-4">
                    <span className="text-muted-foreground">SKU</span>
                    <span className="font-mono">{product.sku}</span>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-border pt-4">
                    <span className="text-muted-foreground">Availability</span>
                    <span>{product.stockQuantity > 0 ? "In stock" : "Out of stock"}</span>
                  </div>
                </div>

                <ProductPurchaseActions
                  productId={product.id}
                  productSlug={product.slug}
                  productName={product.name}
                  productPrice={product.price}
                  stockQuantity={product.stockQuantity}
                  isAuthenticated={isAuthenticated}
                  addresses={addresses}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 ? (
        <section className="border-t border-border bg-card px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-3xl font-semibold tracking-[-0.04em]">
              More to browse
            </h2>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((relatedProduct, index) => (
                <ProductCard
                  key={relatedProduct.id}
                  product={relatedProduct}
                  index={index}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
