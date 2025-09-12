import { Queue, QueueScheduler } from "bullmq";
import logger from "../utils/logger.js";
import { redis } from "../configs/redis.config.js";

export const ORDER_CONFIRM_QUEUE_NAME = "order-confirm-queue";

export type ConfirmOrderJobData = {
  orderId: number;
};

export const orderConfirmQueue = new Queue<ConfirmOrderJobData>(
  ORDER_CONFIRM_QUEUE_NAME,
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

new QueueScheduler(ORDER_CONFIRM_QUEUE_NAME, { connection: redis });

logger.info("Order confirm queue initialized");

export default orderConfirmQueue;
