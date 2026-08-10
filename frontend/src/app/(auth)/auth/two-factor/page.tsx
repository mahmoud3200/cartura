import { TwoFactorForm } from "@/features/auth/components/two-factor-form";
import { AuthShell } from "@/features/auth/ui/auth-shell";

export default function TwoFactorPage() {
  return (
    <AuthShell
      title="Verify this sign-in"
      description="Send and enter the email code to keep your customer account protected."
      alternate={{
        label: "Use a different account?",
        href: "/auth/login",
        action: "Return to login",
      }}
    >
      <TwoFactorForm />
    </AuthShell>
  );
}
