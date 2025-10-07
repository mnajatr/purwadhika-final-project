import { Queue, QueueScheduler } from "bullmq";
import logger from "../utils/logger.js";
import { bullConnection } from "../configs/redis.config.js";

export const ORDER_CANCEL_QUEUE_NAME = "order-cancel-queue";

export type CancelOrderJobData = {
  orderId: number;
};

// If bullConnection is not available (e.g., missing env in serverless build),
// provide a minimal no-op fallback so imports don't crash the server.
let orderCancelQueueInternal: Queue<CancelOrderJobData> | null = null;

if (bullConnection) {
  orderCancelQueueInternal = new Queue<CancelOrderJobData>(
    ORDER_CANCEL_QUEUE_NAME,
    {
      connection: bullConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }
  );

  // A QueueScheduler is required for delayed jobs to be promoted and processed.
  // Without a scheduler, delayed jobs remain unpromoted and won't be processed.
  new QueueScheduler(ORDER_CANCEL_QUEUE_NAME, { connection: bullConnection });

  logger.info("Order cancel queue initialized");
} else {
  logger.warn(
    "Order cancel queue not initialized because bullConnection is not configured. Jobs will be no-ops."
  );
}

// Export a small facade so callers can do `orderCancelQueue.add(...)` safely.
const facade = {
  add: async (name: string | CancelOrderJobData, data?: any, opts?: any) => {
    if (!orderCancelQueue) {
      logger.warn(
        `Skipping enqueue for ${ORDER_CANCEL_QUEUE_NAME} because Redis is not configured.`
      );
      return null as any;
    }
    // If caller passes only data
    if (typeof name !== "string") {
      return orderCancelQueueInternal!.add("default", name as CancelOrderJobData, data);
    }
      return orderCancelQueueInternal!.add(name as string, data, opts);
  },
    getJob: async (id: string) => {
      // No-op fallback: return null when Redis is not configured
      return null;
    },
};

// Named export for compatibility with existing imports
export const orderCancelQueue =
  (orderCancelQueueInternal ?? (facade as unknown as Queue<CancelOrderJobData>));

export default orderCancelQueue;
