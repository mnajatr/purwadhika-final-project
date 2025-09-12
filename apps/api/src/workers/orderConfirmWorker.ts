import { Worker, Job } from "bullmq";
import { prisma } from "@repo/database";
import logger from "../utils/logger.js";
import {
  ORDER_CONFIRM_QUEUE_NAME,
  type ConfirmOrderJobData,
} from "../queues/orderConfirmQueue.js";
import { redis } from "../configs/redis.config.js";

logger.info("✅ Order confirm worker is running...");

const worker = new Worker<ConfirmOrderJobData>(
  ORDER_CONFIRM_QUEUE_NAME,
  async (job: Job<ConfirmOrderJobData>) => {
    const { orderId } = job.data;
    logger.info(`🚀 Starting confirm job for order=${orderId}`);

    try {
      const result = await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({ where: { id: orderId } });
        if (!order) {
          logger.warn(`Order ${orderId} not found, skipping confirm`);
          return { skipped: true };
        }

        logger.info(`Order ${orderId} current status: ${order.status}`);
        // Only confirm when currently SHIPPED
        if (order.status !== "SHIPPED") {
          logger.info(`Order ${orderId} not in SHIPPED state, skipping`);
          return { skipped: true };
        }

        const updated = await tx.order.update({
          where: { id: orderId },
          data: { status: "CONFIRMED" },
        });

        return { skipped: false, updated };
      });

      logger.info(`✅ Confirm job done for order=${orderId}: ${JSON.stringify(result)}`);
      return result;
    } catch (err) {
      logger.error(`❌ Failed confirm job for order=${orderId}: ${String(err)}`);
      throw err;
    }
  },
  { connection: redis }
);

worker.on("failed", (job: Job<ConfirmOrderJobData> | undefined, err: Error) => {
  logger.error(
    `❌ Order confirm job failed. id=${job?.id} data=${JSON.stringify(job?.data)} error=${String(err)}`
  );
});

worker.on("completed", (job: Job<ConfirmOrderJobData>) => {
  logger.info(
    `🎉 Order confirm job completed. id=${job.id} data=${JSON.stringify(job.data)}`
  );
});

export default worker;
