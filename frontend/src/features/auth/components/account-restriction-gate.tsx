import { redirect } from "next/navigation";
import { connection } from "next/server";

import { logoutAction } from "../actions/logout.action";
import { getCurrentAuthUser } from "../api/auth-api";
import { AccountRestrictedView } from "../ui/account-restricted-view";

export async function AccountRestrictionGate() {
  await connection();
  const user = await getCurrentAuthUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (user.accountStatus === "active") {
    redirect("/");
  }

  return <AccountRestrictedView user={user} signOutAction={logoutAction} />;
}
