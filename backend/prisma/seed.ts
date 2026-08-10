import { prisma } from "../src/infrastructure/database/prisma.js";
import { seedAuthorization } from "../src/modules/authorization/authorization.seed.js";
import { provisionConfiguredSuperAdmin } from "../src/modules/authorization/super-admin.provisioning.js";
import { seedDevelopmentRoleUsers } from "../src/modules/authorization/development.seed.js";
import { env } from "../src/config/env.js";

async function main(): Promise<void> {
  await seedAuthorization(prisma);
  await provisionConfiguredSuperAdmin();
  if (env.NODE_ENV === "development") {
    await seedDevelopmentRoleUsers(prisma);
  }

  console.log("Database seed completed successfully.");
}

main()
  .catch((error: unknown) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
