import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/shared/ui/button";

export function StorefrontFooterCta() {
  return (
    <div className="grid gap-8 overflow-hidden rounded-lg bg-primary p-6 text-primary-foreground sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end lg:p-10">
      <div>
        <h2 className="max-w-3xl text-balance text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
          Make your next checkout quicker.
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-6 text-primary-foreground/72">
          Create an account to save delivery details, review orders, and keep
          everything in one place.
        </p>
      </div>
      <div className="flex flex-col items-start gap-3 lg:items-end">
        <Link
          href="/auth/register"
          className={buttonVariants({
            size: "lg",
            className:
              "h-11 rounded-md !bg-slate-950 px-5 !text-slate-50 hover:!bg-slate-900",
          })}
        >
          Create account
          <ArrowRight />
        </Link>
        <Link
          href="/auth/login"
          className="text-sm font-medium text-primary-foreground/80 underline-offset-4 transition hover:text-primary-foreground hover:underline"
        >
          Already have an account? Sign in
        </Link>
      </div>
    </div>
  );
}
