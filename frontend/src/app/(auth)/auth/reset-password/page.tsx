import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { AuthShell } from "@/features/auth/ui/auth-shell";

type AuthPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ResetPasswordPage({ searchParams }: AuthPageProps) {
  const params = await searchParams;
  const email = getFirstParam(params.email);

  return (
    <AuthShell
      title="Choose a new password"
      description="Use the reset code from your email and choose a secure password."
      alternate={{
        label: "Remembered your password?",
        href: "/auth/login",
        action: "Sign in",
      }}
    >
      <ResetPasswordForm defaultEmail={email} />
    </AuthShell>
  );
}

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
