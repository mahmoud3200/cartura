export type OAuthFlow = "login" | "register";

export function getSafeInternalRedirect(
  value: string,
  fallback = "/",
) {
  return value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

export function getOAuthEntryPath(flow: OAuthFlow) {
  return flow === "register" ? "/auth/register" : "/auth/login";
}

export function createOAuthRedirectUrls({
  frontendUrl,
  redirectTo,
  flow,
}: {
  frontendUrl: string;
  redirectTo: string;
  flow: OAuthFlow;
}) {
  const callbackURL = new URL(
    getSafeInternalRedirect(redirectTo),
    frontendUrl,
  ).toString();
  const errorCallbackURL = new URL(getOAuthEntryPath(flow), frontendUrl);
  errorCallbackURL.searchParams.set("oauth", "failed");

  return {
    callbackURL,
    errorCallbackURL: errorCallbackURL.toString(),
    newUserCallbackURL: callbackURL,
  };
}
