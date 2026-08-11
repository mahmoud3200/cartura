import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import {
  getStorefrontProductBySlug,
  listStorefrontCategoryProducts,
} from "@/features/storefront/products/api/products-api";
import { StorefrontApiError } from "@/features/storefront/shared/api/catalog-client";
import { ProductDetailPage } from "@/features/storefront/products/components/product-detail-page";
import { ProductDetailSkeleton } from "@/features/storefront/products/ui/product-detail-skeleton";
import { getCurrentAuthUser } from "@/features/auth/api/auth-api";
import { listAddresses } from "@/features/account/api/addresses-api";

type ProductRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata(
  context: ProductRouteContext,
): Promise<Metadata> {
  await connection();
  const { slug } = await context.params;
  const product = await getStorefrontProductBySlug(slug).catch(() => null);

  if (!product) {
    return {
      title: "Product | Cartura",
      description: "Browse a product from the Cartura catalog.",
    };
  }

  const imageUrl = product.images[0]?.imageUrl ?? "/visuals/collection-home.svg";
  const description =
    product.description ??
    `${product.name} is available in the Cartura catalog.`;

  return {
    title: `${product.name} | Cartura`,
    description,
    openGraph: {
      title: product.name,
      description,
      images: [imageUrl],
    },
  };
}

export default function ProductRoutePage(context: ProductRouteContext) {
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductRouteContent context={context} />
    </Suspense>
  );
}

async function ProductRouteContent({
  context,
}: {
  context: ProductRouteContext;
}) {
  await connection();
  const { slug } = await context.params;
  const [product, user] = await Promise.all([
    getProductOrNotFound(slug),
    getCurrentAuthUser(),
  ]);
  const categorySlug = product.categories[0]?.slug;
  const related = categorySlug
    ? await listStorefrontCategoryProducts(categorySlug, { limit: 5 }).catch(
        () => null,
      )
    : null;
  const relatedProducts =
    related?.data
      .filter((relatedProduct) => relatedProduct.id !== product.id)
      .slice(0, 4) ?? [];
  const addresses = user ? await listAddresses().catch(() => []) : undefined;

  return (
    <ProductDetailPage
      product={product}
      relatedProducts={relatedProducts}
      isAuthenticated={Boolean(user)}
      addresses={addresses}
    />
  );
}

async function getProductOrNotFound(slug: string) {
  try {
    return await getStorefrontProductBySlug(slug);
  } catch (error) {
    if (error instanceof StorefrontApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}
