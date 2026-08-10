import "server-only";

import { cookies } from "next/headers";

import { AUTH_SESSION_TOKEN_COOKIE } from "@/shared/lib/auth-session";

const authSessionTokenMaxAge = 60 * 60 * 24 * 30;

export async function getAuthSessionToken() {
  const cookieStore = await cookies();

  return cookieStore.get(AUTH_SESSION_TOKEN_COOKIE)?.value ?? null;
}

export async function setAuthSessionToken(token: string) {
  const cookieStore = await cookies();

  cookieStore.set(AUTH_SESSION_TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: authSessionTokenMaxAge,
  });
}

export async function clearAuthSessionToken() {
  const cookieStore = await cookies();

  cookieStore.delete(AUTH_SESSION_TOKEN_COOKIE);
}
