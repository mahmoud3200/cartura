import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { closeRedisClient } from "./infrastructure/cache/index.js";
import { prisma } from "./infrastructure/database/prisma.js";
import { startBackgroundWorkers } from "./infrastructure/workers/background-workers.js";

async function bootstrap(): Promise<void> {
  console.log("Connecting to PostgreSQL...");
  await prisma.$connect();
  console.log("PostgreSQL connected. Starting background workers...");

  const app = createApp();
  const workers = await startBackgroundWorkers();
  console.log("Background workers ready. Starting HTTP server...");

  const server = app.listen(env.PORT, () => {
    console.log(`Cartura API running at http://localhost:${env.PORT}`);
  });

  async function shutdown(signal: string): Promise<void> {
    console.log(`${signal} received. Shutting down.`);
    server.close(async () => {
      await workers.stop();
      await closeRedisClient();
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
