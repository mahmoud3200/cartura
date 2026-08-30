import { hashPassword } from "better-auth/crypto";

import { env } from "../../config/env.js";
import { authorizationProvisioningRepository } from "./authorization.provisioning.repository.js";

export async function provisionConfiguredSuperAdmin(): Promise<void> {
  if (!env.SUPER_ADMIN_BOOTSTRAP_ENABLED) {
    return;
  }

  const email = env.SUPER_ADMIN_EMAIL.toLowerCase();
  const firstName = env.SUPER_ADMIN_FIRST_NAME;
  const lastName = env.SUPER_ADMIN_LAST_NAME;
  const name =
    `${env.SUPER_ADMIN_FIRST_NAME} ${env.SUPER_ADMIN_LAST_NAME}`.trim();
  const passwordHash = env.SUPER_ADMIN_PASSWORD.length >= 8
    ? await hashPassword(env.SUPER_ADMIN_PASSWORD)
    : undefined;

  await authorizationProvisioningRepository.provisionSuperAdmin({
    email,
    firstName,
    lastName,
    name,
    passwordHash,
  });
}
