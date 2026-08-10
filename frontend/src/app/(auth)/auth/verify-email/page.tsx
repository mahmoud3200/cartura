import { VerifyEmailForm } from "@/features/auth/components/verify-email-form";
import { AuthShell } from "@/features/auth/ui/auth-shell";

type AuthPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function VerifyEmailPage({ searchParams }: AuthPageProps) {
  const params = await searchParams;
  const email = getFirstParam(params.email);

  return (
    <AuthShell
      title="Verify your email"
      description="Enter the 6-digit code so order updates can reach the right inbox."
      alternate={{
        label: "Already verified?",
        href: "/auth/login",
        action: "Sign in",
      }}
    >
      <VerifyEmailForm defaultEmail={email} />
    </AuthShell>
  );
}

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
