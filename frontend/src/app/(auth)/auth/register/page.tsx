import { RegisterForm } from "@/features/auth/components/register-form";
import { OAuthButtons } from "@/features/auth/components/oauth-buttons";
import { AuthShell } from "@/features/auth/ui/auth-shell";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{
    oauth?: string;
    error?: string;
    error_description?: string;
  }>;
}) {
  const {
    error,
    error_description: errorDescription,
    oauth,
  } = await searchParams;

  return (
    <AuthShell
      title="Create your Cartura account"
      description="Save delivery details, review purchases, and make future checkouts quicker."
      alternate={{
        label: "Already have an account?",
        href: "/auth/login",
        action: "Sign in",
      }}
    >
      <RegisterForm />
      <OAuthButtons
        flow="register"
        error={error ?? oauth}
        errorDescription={errorDescription}
      />
    </AuthShell>
  );
}
