import Link from "next/link";

const footerGroups = [
  {
    title: "Shop",
    links: [
      { label: "All products", href: "/products" },
      { label: "Categories", href: "/categories" },
      { label: "New arrivals", href: "/#new-arrivals" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "My account", href: "/settings" },
      { label: "Orders", href: "/settings/orders" },
      { label: "Cart", href: "/cart" },
    ],
  },
  {
    title: "Cartura",
    links: [
      { label: "About us", href: "/#about-us" },
      { label: "Style edit", href: "/#style-edit" },
      { label: "Contact", href: "mailto:hello@cartura.local" },
    ],
  },
];

export function StorefrontFooterNavigation({
  hasAccountCta = true,
}: {
  hasAccountCta?: boolean;
}) {
  return (
    <>
      <div
        className={`grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)] ${
          hasAccountCta ? "mt-12 border-t border-border pt-10" : ""
        }`}
      >
        <div className="max-w-sm">
          <p className="text-lg font-semibold tracking-[-0.025em]">Cartura</p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Everyday clothing and accessories for building a look that feels
            like your own.
          </p>
        </div>
        {footerGroups.map((group) => (
          <nav key={group.title} aria-label={`${group.title} links`}>
            <p className="text-sm font-medium text-foreground">{group.title}</p>
            <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
              {group.links.map((link) => (
                <Link
                  key={`${group.title}-${link.href}`}
                  href={link.href}
                  className="w-fit transition hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        ))}
      </div>
      <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Copyright Cartura</p>
        <p>Clothing, accessories, and the details between.</p>
      </div>
    </>
  );
}
