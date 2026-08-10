import {
  oauthAuthorizeRequestSchema,
  oauthAuthorizeResponseSchema,
  type OAuthAuthorizeRequest,
} from "@cartura/contracts/auth";

export async function startGoogleOAuth(input: OAuthAuthorizeRequest) {
  const request = oauthAuthorizeRequestSchema.parse(input);
  const response = await fetch("/api/v1/auth/sign-in/social", {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });
  const payload: unknown = await response.json();

  if (!response.ok) {
    throw new Error("Google authentication could not be started.");
  }

  return oauthAuthorizeResponseSchema.parse(payload).url;
}
