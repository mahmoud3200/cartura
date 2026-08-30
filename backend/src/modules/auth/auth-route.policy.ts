const restrictionExemptPaths = [
  "/callback/",
  "/email-otp/request-password-reset",
  "/email-otp/reset-password",
  "/email-otp/send-verification-otp",
  "/email-otp/verify-email",
  "/get-session",
  "/sign-in/email",
  "/sign-in/social",
  "/sign-out",
  "/sign-up/email",
  "/verify-email",
] as const;

export function isAuthRestrictionExemptPath(path: string): boolean {
  const authPath = path.startsWith("/api/v1/auth")
    ? path.slice("/api/v1/auth".length) || "/"
    : path;

  return restrictionExemptPaths.some((allowedPath) =>
    allowedPath.endsWith("/")
      ? authPath.startsWith(allowedPath)
      : authPath === allowedPath,
  );
}
