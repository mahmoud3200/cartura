import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./infrastructure/database/prisma.js";

async function bootstrap(): Promise<void> {
  await prisma.$connect();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`Cartura API running at http://localhost:${env.PORT}`);
  });

  async function shutdown(signal: string): Promise<void> {
    console.log(`${signal} received. Shutting down.`);

    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  }

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
}

bootstrap().catch(async (error: unknown) => {
  console.error("Failed to start Cartura API:", error);

  await prisma.$disconnect();
  process.exit(1);
});
