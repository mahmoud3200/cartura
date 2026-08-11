import {
  ArrowUpRight,
  CircleUserRound,
  MapPin,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

const destinations = [
  {
    title: "Personal details",
    description: "Keep your name and contact details current.",
    href: "/settings/profile",
    icon: CircleUserRound,
    className: "md:col-span-7",
  },
  {
    title: "Saved addresses",
    description: "Manage delivery destinations and your default address.",
    href: "/settings/addresses",
    icon: MapPin,
    className: "md:col-span-5",
  },
  {
    title: "Order history",
    description: "Follow payment, fulfillment, and delivery progress.",
    href: "/settings/orders",
    icon: ReceiptText,
    className: "md:col-span-5",
  },
  {
    title: "Sign-in security",
    description: "Review email verification and two-factor protection.",
    href: "/settings/security",
    icon: ShieldCheck,
    className: "md:col-span-7",
  },
];

export function AccountDestinationGrid() {
  return (
    <section>
      <h2 className="text-xl font-semibold tracking-tight">
        Manage your account
      </h2>
      <div className="mt-5 grid grid-flow-dense grid-cols-1 gap-3 md:grid-cols-12">
        {destinations.map((destination) => {
          const Icon = destination.icon;

          return (
            <Link
              key={destination.href}
              href={destination.href}
              className={`${destination.className} group overflow-hidden rounded-xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-[0_18px_55px_color-mix(in_oklch,var(--foreground),transparent_94%)] active:translate-y-0`}
            >
              <div className="flex items-start justify-between gap-6">
                <span className="grid size-10 place-items-center rounded-lg bg-muted text-foreground transition-transform duration-500 ease-out group-hover:scale-105">
                  <Icon className="size-5" strokeWidth={1.7} />
                </span>
                <ArrowUpRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
              </div>
              <h3 className="mt-5 text-lg font-semibold sm:mt-8">
                {destination.title}
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                {destination.description}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
