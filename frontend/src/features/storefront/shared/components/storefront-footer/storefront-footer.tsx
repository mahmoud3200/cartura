import { getCurrentAuthUser } from "@/features/auth/api/auth-api";

import { StorefrontFooterContent } from "./footer-content";

export async function StorefrontFooter() {
  const user = await getCurrentAuthUser();

  return <StorefrontFooterContent showAccountCta={!user} />;
}
