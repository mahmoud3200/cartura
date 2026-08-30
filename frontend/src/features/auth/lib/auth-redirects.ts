export type OAuthFlow = "login" | "register";

const oauthCompletionPath = "/auth/oauth/complete";

export function getSafeInternalRedirect(
  value: string,
  fallback = "/",
) {
  return value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

export function getOAuthEntryPath(flow: OAuthFlow) {
  return flow === "register" ? "/auth/register" : "/auth/login";
}

export function getOAuthCompletionRedirect(value: string | null) {
  return getSafeInternalRedirect(value ?? "/");
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
  const completionURL = new URL(oauthCompletionPath, frontendUrl);
  completionURL.searchParams.set(
    "redirectTo",
    getSafeInternalRedirect(redirectTo),
  );
  const errorCallbackURL = new URL(getOAuthEntryPath(flow), frontendUrl);
  errorCallbackURL.searchParams.set("oauth", "failed");

  return {
    callbackURL: completionURL.toString(),
    errorCallbackURL: errorCallbackURL.toString(),
    newUserCallbackURL: completionURL.toString(),
  };
}
