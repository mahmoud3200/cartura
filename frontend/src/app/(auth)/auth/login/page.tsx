import { LoginForm } from "@/features/auth/components/login-form";
import { OAuthButtons } from "@/features/auth/components/oauth-buttons";
import { AuthShell } from "@/features/auth/ui/auth-shell";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    redirect?: string;
    oauth?: string;
    error?: string;
    error_description?: string;
  }>;
}) {
  const {
    error,
    error_description: errorDescription,
    oauth,
    redirect,
  } = await searchParams;
  const redirectTo = redirect?.startsWith("/") && !redirect.startsWith("//")
    ? redirect
    : "/";

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to review orders, manage delivery details, and continue shopping."
      alternate={{
        label: "New to Cartura?",
        href: "/auth/register",
        action: "Create an account",
      }}
    >
      <LoginForm redirectTo={redirectTo} />
      <OAuthButtons
        flow="login"
        redirectTo={redirectTo}
        error={error ?? oauth}
        errorDescription={errorDescription}
      />
    </AuthShell>
  );
}
