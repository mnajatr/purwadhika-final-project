import { Queue, QueueScheduler } from "bullmq";
import logger from "../utils/logger.js";
import { redis } from "../configs/redis.config.js";

export const ORDER_CANCEL_QUEUE_NAME = "order-cancel-queue";

export type CancelOrderJobData = {
  orderId: number;
};

export const orderCancelQueue = new Queue<CancelOrderJobData>(
  ORDER_CANCEL_QUEUE_NAME,
  {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: true,
      removeOnFail: false,
    },
  }
);

// A QueueScheduler is required for delayed jobs to be promoted and processed.
// Without a scheduler, jobs added with a `delay` remain in Redis delayed set
// and will not be moved to the waiting list for workers to pick up.
new QueueScheduler(ORDER_CANCEL_QUEUE_NAME, { connection: redis });

logger.info("Order cancel queue initialized");

export default orderCancelQueue;
