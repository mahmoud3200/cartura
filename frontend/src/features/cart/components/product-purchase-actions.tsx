"use client";

import { CreditCard, ShoppingCart } from "lucide-react";
import Link from "next/link";

import type { AddressResponse } from "@cartura/contracts/addresses";

import { Button } from "@/shared/ui/button";

import { useProductPurchase } from "../hooks/use-product-purchase";
import { BuyNowSheet } from "../ui/buy-now-sheet";

export function ProductPurchaseActions({
  productId,
  productSlug,
  productName,
  productPrice,
  stockQuantity,
  isAuthenticated,
  addresses,
}: {
  productId: string;
  productSlug: string;
  productName: string;
  productPrice: number;
  stockQuantity: number;
  isAuthenticated: boolean;
  addresses?: AddressResponse[];
}) {
  const purchase = useProductPurchase({ productId, productSlug, productName });
  const isOutOfStock = stockQuantity === 0;

  if (!isAuthenticated) {
    return (
      <div className="mt-8 grid gap-2 sm:grid-cols-2">
        <Button
          nativeButton={false}
          render={<Link href={purchase.loginHref} />}
          variant="outline"
          className="h-11 w-full"
          disabled={isOutOfStock}
        >
          <ShoppingCart className="size-4" />
          {isOutOfStock ? "Out of stock" : "Sign in to add"}
        </Button>
        <Button
          nativeButton={false}
          render={<Link href={purchase.loginHref} />}
          className="h-11 w-full"
          disabled={isOutOfStock}
        >
          <CreditCard className="size-4" />
          {isOutOfStock ? "Unavailable" : "Sign in to buy"}
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-2 sm:grid-cols-2">
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full"
        disabled={isOutOfStock || purchase.isPending}
        onClick={purchase.addToCart}
      >
        <ShoppingCart className="size-4" />
        {isOutOfStock
          ? "Out of stock"
          : purchase.isAddingToCart
            ? "Adding..."
            : "Add to cart"}
      </Button>
      <Button
        type="button"
        className="h-11 w-full"
        disabled={isOutOfStock || purchase.isPending}
        onClick={purchase.openBuyNow}
      >
        <CreditCard className="size-4" />
        {isOutOfStock
          ? "Unavailable"
          : purchase.isBuyingNow
            ? "Preparing..."
            : "Buy now"}
      </Button>

      {isAuthenticated && addresses && (
        <BuyNowSheet
          isOpen={purchase.isBuyNowOpen}
          onClose={purchase.closeBuyNow}
          productName={productName}
          productPrice={productPrice}
          addresses={addresses}
          isPending={purchase.isBuyingNow}
          onConfirm={purchase.buyNow}
        />
      )}
    </div>
  );
}
