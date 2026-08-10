import { CachedCollectionGrid } from "./collection-grid";
import { HeroSection } from "./hero-section";
import { CachedProductShowcase } from "./product-showcase";

export function StorefrontPage() {
  return (
    <main className="relative">
      <HeroSection />
      <CachedCollectionGrid />
      <CachedProductShowcase />
    </main>
  );
}
