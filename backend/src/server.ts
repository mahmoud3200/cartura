import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./infrastructure/database/prisma.js";
import {
  closeRateLimitRedis,
  connectRateLimitRedis,
} from "./infrastructure/rate-limit-redis.client.js";
import { startBackgroundWorkers } from "./infrastructure/workers/background-workers.js";

async function bootstrap(): Promise<void> {
  let workers: Awaited<ReturnType<typeof startBackgroundWorkers>> | null =
    null;

  try {
    console.log("Connecting to PostgreSQL...");
    await prisma.$connect();
    console.log("PostgreSQL connected. Connecting rate-limit Redis...");
    await connectRateLimitRedis();
    console.log("Rate-limit Redis ready. Starting background workers...");

    workers = await startBackgroundWorkers();
    console.log("Background workers ready. Starting HTTP server...");
  } catch (error) {
    await cleanupFailedStart(workers);
    throw error;
  }

  const app = createApp();
  let server: ReturnType<typeof app.listen>;

  try {
    server = await listen(app, env.PORT);
  } catch (error) {
    await cleanupFailedStart(workers);
    throw error;
  }

  console.log(`Cartura API running at http://localhost:${env.PORT}`);
  let shutdownPromise: Promise<void> | null = null;

  function shutdown(signal: string): Promise<void> {
    if (shutdownPromise) {
      return shutdownPromise;
    }

    shutdownPromise = (async () => {
      console.log(`${signal} received. Shutting down.`);
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
      await workers?.stop();
      await closeRateLimitRedis();
      await prisma.$disconnect();
    })();

    return shutdownPromise;
  }

  function handleShutdownSignal(signal: NodeJS.Signals): void {
    void shutdown(signal).then(
      () => process.exit(0),
      (error: unknown) => {
        console.error("Graceful shutdown failed", error);
        process.exit(1);
      },
    );
  }

  process.on("SIGINT", handleShutdownSignal);
  process.on("SIGTERM", handleShutdownSignal);
}

bootstrap().catch((error: unknown) => {
  console.error("Failed to start Cartura API:", error);
  process.exit(1);
});

function listen(
  app: ReturnType<typeof createApp>,
  port: number,
): Promise<ReturnType<typeof app.listen>> {
  return new Promise((resolve, reject) => {
    const server = app.listen(port);

    server.once("listening", () => {
      server.off("error", reject);
      resolve(server);
    });
    server.once("error", reject);
  });
}

async function cleanupFailedStart(
  workers: Awaited<ReturnType<typeof startBackgroundWorkers>> | null,
): Promise<void> {
  if (workers) {
    await Promise.allSettled([workers.stop()]);
  }

  await Promise.allSettled([closeRateLimitRedis(), prisma.$disconnect()]);
}
