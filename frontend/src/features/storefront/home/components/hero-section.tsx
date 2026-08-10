import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { buttonVariants } from "@/shared/ui/button";

import { hero } from "@/features/storefront/home/data/storefront-content";

export function HeroSection() {
  return (
    <section className="grain relative isolate overflow-hidden border-b border-foreground/10">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: `url(${hero.image})` }}
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(12_15_18/0.9),rgb(12_15_18/0.58)_54%,rgb(12_15_18/0.3))]" />
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col justify-end px-4 pb-[10%] pt-20 sm:px-6 lg:px-8">
        <div className="max-w-6xl pb-8 text-white">
          <p className="reveal mb-5 text-sm leading-6 text-white/72 [--index:0]">
            {hero.eyebrow}
          </p>
          <h1 className="reveal max-w-6xl text-balance text-[clamp(3.1rem,7.4vw,6.5rem)] font-semibold leading-[0.94] tracking-[-0.055em] [--index:1]">
            {hero.title}
          </h1>
          <p className="reveal mt-6 max-w-xl text-pretty text-base leading-7 text-white/74 [--index:2]">
            {hero.text}
          </p>
          <div className="reveal mt-8 flex flex-col gap-3 sm:flex-row [--index:3]">
            <Link
              href={hero.primaryCta.href}
              className={buttonVariants({
                size: "lg",
                className:
                  "h-11 rounded-md bg-white px-5 text-zinc-950 hover:bg-white/90",
              })}
            >
              {hero.primaryCta.label}
              <ArrowRight />
            </Link>
            <Link
              href={hero.secondaryCta.href}
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className:
                  "h-11 rounded-md border-white/45 bg-white/10 px-5 text-white hover:bg-white/16 hover:text-white",
              })}
            >
              {hero.secondaryCta.label}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
