import { Suspense, type ReactNode } from "react";

import {
  StorefrontFooterContent,
} from "@/features/storefront/shared/components/storefront-footer/footer-content";
import { StorefrontFooter } from "@/features/storefront/shared/components/storefront-footer/storefront-footer";
import {
  CachedStorefrontHeader,
  StorefrontHeader,
} from "@/features/storefront/shared/components/storefront-header/storefront-header";

export default async function LandingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="w-full max-w-full overflow-x-hidden bg-background">
      <Suspense fallback={<StorefrontHeader />}>
        <CachedStorefrontHeader />
      </Suspense>
      <div className="pt-16">{children}</div>
      <Suspense fallback={<StorefrontFooterContent showAccountCta={false} />}>
        <StorefrontFooter />
      </Suspense>
    </div>
  );
}
