const oauthErrorMessages: Record<string, string> = {
  access_denied:
    "Google authorization was cancelled, or this account is not allowed by the OAuth consent screen.",
  account_already_linked_to_different_user:
    "This Google account is already linked to a different Cartura account.",
  account_not_linked:
    "An account with this email already exists. Sign in with its original method before linking Google.",
  invalid_code:
    "Google could not validate the authorization. Confirm that the client ID and secret belong to the same OAuth client.",
  no_code:
    "Google did not return an authorization code. Start the sign-up again and complete the consent screen.",
  signup_disabled:
    "New accounts cannot currently be created with Google.",
  state_mismatch:
    "Cartura could not verify the Google sign-up cookie. Start again after the auth callback configuration is updated.",
  state_not_found:
    "The Google sign-up session could not be found. Start again from this page.",
  unable_to_create_session:
    "Your Google account was accepted, but Cartura could not start a session. Please try again.",
  unable_to_create_user:
    "Google verified your account, but Cartura could not create the customer profile.",
  unable_to_get_user_info:
    "Google did not return the profile details required to create your account.",
};

export function getOAuthErrorMessage(
  errorCode?: string,
  errorDescription?: string,
) {
  const normalizedCode = errorCode?.trim().toLowerCase();

  if (normalizedCode && oauthErrorMessages[normalizedCode]) {
    return oauthErrorMessages[normalizedCode];
  }

  const normalizedDescription = errorDescription?.trim();

  if (normalizedDescription) {
    return `Google returned: ${normalizedDescription.slice(0, 180)}`;
  }

  if (normalizedCode && normalizedCode !== "failed") {
    return `Google authentication failed (${normalizedCode}). Please try again.`;
  }

  return "Google authentication could not be completed. Please try again.";
}
