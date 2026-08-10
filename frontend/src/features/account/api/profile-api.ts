import "server-only";

import {
  updateProfileResponseSchema,
  type UpdateProfileRequest,
} from "@cartura/contracts/auth";

import { serverApiFetch } from "@/shared/api/server-api";

export async function updateProfile(input: UpdateProfileRequest) {
  const payload = await serverApiFetch<unknown>("/api/v1/auth/update-user", {
    method: "POST",
    json: input,
    forwardCookies: true,
    storeCookies: true,
  });

  return updateProfileResponseSchema.parse(payload);
}
