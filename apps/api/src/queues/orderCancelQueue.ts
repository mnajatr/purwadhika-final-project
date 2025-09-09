import { Queue } from "bullmq";
import logger from "../utils/logger.js";
import { redis } from "../configs/redis.config.js";

export const ORDER_CANCEL_QUEUE_NAME = "order-cancel-queue";

export type CancelOrderJobData = {
  orderId: number;
};

export const orderCancelQueue = new Queue<CancelOrderJobData>(ORDER_CANCEL_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

logger.info("Order cancel queue initialized");

export default orderCancelQueue;
