import { StorefrontFooterCta } from "./footer-cta";
import { StorefrontFooterNavigation } from "./footer-navigation";

export function StorefrontFooterContent({
  showAccountCta = true,
}: {
  showAccountCta?: boolean;
}) {
  return (
    <footer
      id="contact-us"
      className="border-t border-foreground/10 px-4 py-12 sm:px-6 lg:px-8 lg:py-16"
    >
      <div className="mx-auto max-w-7xl">
        {showAccountCta ? <StorefrontFooterCta /> : null}
        <StorefrontFooterNavigation hasAccountCta={showAccountCta} />
      </div>
    </footer>
  );
}
