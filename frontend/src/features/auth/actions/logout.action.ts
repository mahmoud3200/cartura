"use server";

import { redirect } from "next/navigation";

import { clearAuthSessionToken } from "@/shared/api/auth-token";

import * as authApi from "../api/auth-api";

export async function logoutAction() {
  try {
    await authApi.logout();
  } finally {
    await clearAuthSessionToken();
  }

  redirect("/auth/login");
}
