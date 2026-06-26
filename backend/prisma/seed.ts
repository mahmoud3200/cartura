import { prisma } from "../src/infrastructure/database/prisma.js";
import { seedAuthorization } from "../src/modules/authorization/authorization.seed.js";

async function main(): Promise<void> {
  await seedAuthorization(prisma);

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
