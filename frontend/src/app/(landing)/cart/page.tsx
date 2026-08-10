import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { listAddresses } from "@/features/account/api/addresses-api";
import { getCurrentAuthUser } from "@/features/auth/api/auth-api";
import { getCustomerCart } from "@/features/cart/api/cart-api";
import { CartPage } from "@/features/cart/components/cart-page";

export const metadata: Metadata = {
  title: "Your cart | Cartura",
  description: "Review your Cartura items and continue to secure checkout.",
};

export default function CartRoutePage() {
  return (
    <Suspense fallback={<CartPageLoading />}>
      <AuthenticatedCartPage />
    </Suspense>
  );
}

async function AuthenticatedCartPage() {
  await connection();
  const user = await getCurrentAuthUser();

  if (!user) {
    redirect("/auth/login?redirect=/cart");
  }

  const [cart, addresses] = await Promise.all([
    getCustomerCart(),
    listAddresses(),
  ]);

  return <CartPage initialCart={cart} addresses={addresses} />;
}

function CartPageLoading() {
  return (
    <main className="min-h-[70dvh] animate-pulse px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="h-12 w-64 rounded-lg bg-muted" />
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem]">
          <div className="h-48 rounded-xl bg-muted" />
          <div className="h-96 rounded-xl bg-muted" />
        </div>
      </div>
    </main>
  );
}
