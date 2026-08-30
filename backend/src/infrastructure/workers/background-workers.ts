import { Queue, Worker, type Job } from "bullmq";
import { Redis } from "ioredis";

import { env } from "../../config/env.js";
import { mediaService } from "../../modules/media/media.service.js";
import { notificationDeliveryService } from "../../modules/notifications/index.js";
import { ordersService } from "../../modules/orders/index.js";
import { outboxService } from "../../modules/outbox/index.js";

type WorkerHandle = {
  stop: () => Promise<void>;
};

const MAINTENANCE_QUEUE = "maintenance";
const workerTasks = {
  outbox: () => outboxService.processBatch(),
  notificationDeliveries: () =>
    notificationDeliveryService.processPending(),
  staleOrders: () => ordersService.cancelExpiredAwaitingPaymentOrders(),
  expiredMedia: () =>
    mediaService.cleanupExpiredPending(env.MEDIA_CLEANUP_BATCH_SIZE),
} satisfies Record<string, () => Promise<unknown>>;

type WorkerTaskName = keyof typeof workerTasks;

export async function startBackgroundWorkers(): Promise<WorkerHandle> {
  if (!env.BACKGROUND_WORKERS_ENABLED || !env.REDIS_URL) {
    if (env.BACKGROUND_WORKERS_ENABLED && !env.REDIS_URL) {
      console.warn(
        "Background workers are enabled but REDIS_URL is empty; workers were not started.",
      );
    }

    return { stop: async () => undefined };
  }

  const queueConnection = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
  });
  queueConnection.on("error", (error) => {
    console.error("BullMQ queue Redis connection failed", error.message);
  });

  const queue = new Queue<undefined, unknown, WorkerTaskName>(
    MAINTENANCE_QUEUE,
    {
      connection: queueConnection,
      prefix: env.BULLMQ_PREFIX,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    },
  );

  try {
    await withTimeout(
      Promise.all([
        queue.upsertJobScheduler(
          "outbox",
          { every: env.OUTBOX_POLL_INTERVAL_MS },
          { name: "outbox" },
        ),
        queue.upsertJobScheduler(
          "notificationDeliveries",
          { every: env.NOTIFICATION_DELIVERY_POLL_INTERVAL_MS },
          { name: "notificationDeliveries" },
        ),
        queue.upsertJobScheduler(
          "staleOrders",
          { every: env.STALE_ORDER_POLL_INTERVAL_MS },
          { name: "staleOrders" },
        ),
        queue.upsertJobScheduler(
          "expiredMedia",
          { every: env.MEDIA_CLEANUP_POLL_INTERVAL_MS },
          { name: "expiredMedia" },
        ),
      ]),
      10_000,
    );
  } catch (error) {
    await Promise.allSettled([queue.close()]);
    queueConnection.disconnect();
    throw new Error(
      'BullMQ could not initialize. Run "pnpm redis:up" and verify that Redis is healthy.',
      { cause: error },
    );
  }

  const workerConnection = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });
  workerConnection.on("error", (error) => {
    console.error("BullMQ worker Redis connection failed", error.message);
  });

  let worker: Worker<undefined, unknown, WorkerTaskName> | undefined;
  try {
    worker = new Worker<undefined, unknown, WorkerTaskName>(
      MAINTENANCE_QUEUE,
      async (job: Job<undefined, unknown, WorkerTaskName>) => {
        const task = workerTasks[job.name];

        if (!task) {
          throw new Error(`Unknown maintenance job "${job.name}"`);
        }

        return task();
      },
      {
        connection: workerConnection,
        prefix: env.BULLMQ_PREFIX,
        concurrency: 3,
      },
    );
    await withTimeout(worker.waitUntilReady(), 10_000);
  } catch (error) {
    await Promise.allSettled([worker?.close(true), queue.close()]);
    queueConnection.disconnect();
    workerConnection.disconnect();
    throw new Error("BullMQ worker could not initialize.", { cause: error });
  }

  worker.on("failed", (job, error) => {
    console.error(
      `Background job "${job?.name ?? "unknown"}" failed`,
      error,
    );
  });

  return {
    stop: async () => {
      await worker.close();
      await queue.close();
      await Promise.all([queueConnection.quit(), workerConnection.quit()]);
    },
  };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Redis initialization timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });
}
