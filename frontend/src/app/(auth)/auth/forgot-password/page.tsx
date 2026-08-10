import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { AuthShell } from "@/features/auth/ui/auth-shell";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      description="Request a 6-digit code so you can get back to your orders."
      alternate={{
        label: "Remembered it?",
        href: "/auth/login",
        action: "Sign in",
      }}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
