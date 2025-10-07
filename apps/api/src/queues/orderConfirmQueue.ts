import { Queue, QueueScheduler } from "bullmq";
import logger from "../utils/logger.js";
import { bullConnection } from "../configs/redis.config.js";

export const ORDER_CONFIRM_QUEUE_NAME = "order-confirm-queue";

export type ConfirmOrderJobData = {
  orderId: number;
};

let orderConfirmQueueInternal: Queue<ConfirmOrderJobData> | null = null;

if (bullConnection) {
  orderConfirmQueueInternal = new Queue<ConfirmOrderJobData>(
    ORDER_CONFIRM_QUEUE_NAME,
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

  new QueueScheduler(ORDER_CONFIRM_QUEUE_NAME, { connection: bullConnection });
  logger.info("Order confirm queue initialized");
} else {
  logger.warn(
    "Order confirm queue not initialized because bullConnection is not configured. Jobs will be no-ops."
  );
}

const facade = {
  add: async (name: string | ConfirmOrderJobData, data?: any, opts?: any) => {
    if (!orderConfirmQueueInternal) {
      logger.warn(
        `Skipping enqueue for ${ORDER_CONFIRM_QUEUE_NAME} because Redis is not configured.`
      );
      return null as any;
    }
    if (typeof name !== "string") {
      return orderConfirmQueueInternal.add("default", name as ConfirmOrderJobData, data);
    }
    return orderConfirmQueueInternal.add(name as string, data, opts);
  },
  getJob: async (id: string) => {
    return null;
  },
};

export const orderConfirmQueue =
  (orderConfirmQueueInternal ?? (facade as unknown as Queue<ConfirmOrderJobData>));

export default orderConfirmQueue;
