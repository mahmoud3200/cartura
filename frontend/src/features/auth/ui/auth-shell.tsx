import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { PackageCheck, ShieldCheck, Truck } from "lucide-react";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  alternate?: {
    label: string;
    href: string;
    action: string;
  };
  eyebrow?: string;
};

const accountBenefits: Array<{
  icon: ComponentType<{ className?: string }>;
  label: string;
}> = [
  { icon: PackageCheck, label: "Review current and past orders" },
  { icon: Truck, label: "Save delivery addresses" },
  { icon: ShieldCheck, label: "Keep checkout details protected" },
];

export function AuthShell({
  title,
  description,
  children,
  alternate,
  eyebrow = "Cartura account",
}: AuthShellProps) {
  return (
    <div className="mx-auto grid min-h-[calc(100dvh-4rem)] w-full max-w-7xl items-stretch gap-4 px-4 py-6 sm:px-6 lg:grid-cols-[0.96fr_1.04fr] lg:px-8 lg:py-8">
      <aside className="grain relative hidden overflow-hidden rounded-lg bg-slate-950 p-8 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center opacity-65 contrast-110"
          style={{ backgroundImage: "url(/visuals/cartura-style-edit.png)" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(12_15_18/0.5),rgb(12_15_18/0.78)_52%,rgb(12_15_18/0.96))]" />
        <div className="relative max-w-xl">
          <p className="text-sm text-white/70">Clothing, accessories, orders</p>
          <h2 className="mt-5 text-balance text-5xl font-semibold leading-[0.96] tracking-[-0.055em]">
            Everything you need after you find the right piece.
          </h2>
        </div>
        <div className="relative divide-y divide-white/15 overflow-hidden rounded-lg border border-white/15 bg-slate-950/45 backdrop-blur-sm">
          {accountBenefits.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 p-4 text-sm text-white/78"
            >
              <Icon className="size-4 text-white" />
              {label}
            </div>
          ))}
        </div>
      </aside>

      <section className="flex items-center justify-center rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-8 lg:p-10">
        <div className="w-full max-w-md">
          <p className="text-sm text-muted-foreground">{eyebrow}</p>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-[-0.045em]">
            {title}
          </h1>
          <p className="mt-3 text-pretty text-sm leading-6 text-muted-foreground">
            {description}
          </p>
          <div className="mt-8 space-y-5">
            {children}
            {alternate ? (
              <p className="text-center text-sm text-muted-foreground">
                {alternate.label}{" "}
                <Link
                  href={alternate.href}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {alternate.action}
                </Link>
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
