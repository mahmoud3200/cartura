import type { AuthUser } from "@cartura/contracts/auth";
import { CheckCircle2, KeyRound, MailCheck, ShieldCheck } from "lucide-react";

const iconClassName = "size-5";

export function SecurityOverview({ user }: { user: AuthUser }) {
  const checks = [
    {
      title: "Email verification",
      description: user.emailVerified
        ? `${user.email} is verified.`
        : `${user.email} still needs verification.`,
      value: user.emailVerified ? "Verified" : "Action needed",
      icon: MailCheck,
    },
    {
      title: "Two-factor authentication",
      description: user.twoFactorEnabled
        ? "A one-time code is required during sign-in."
        : "Sign-in currently uses your password without a second factor.",
      value: user.twoFactorEnabled ? "Enabled" : "Not enabled",
      icon: ShieldCheck,
    },
    {
      title: "Password",
      description: "Your password is stored securely and never displayed here.",
      value: "Protected",
      icon: KeyRound,
    },
  ];

  return (
    <div className="mt-8 max-w-3xl space-y-3">
      {checks.map((check) => {
        const Icon = check.icon;
        return (
          <section key={check.title} className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6">
            <span className="grid size-10 place-items-center rounded-lg bg-muted">
              <Icon className={iconClassName} strokeWidth={1.7} />
            </span>
            <div>
              <h2 className="font-semibold">{check.title}</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{check.description}</p>
            </div>
            <span className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="size-4 text-primary" />
              {check.value}
            </span>
          </section>
        );
      })}
      <p className="px-1 pt-3 text-sm leading-6 text-muted-foreground">
        Password changes and two-factor enrollment will be added when those verified account flows are available in the customer API.
      </p>
    </div>
  );
}
