import { Worker } from "bullmq";
import { redis } from "../configs/redis.config.js";
import { prisma } from "@repo/database";
import logger from "../utils/logger.js";

export const autoConfirmWorker = new Worker(
  "auto-confirm",
  async (job) => {
    const { orderId } = job.data;

    logger.info(`Processing auto-confirmation for order ${orderId}`);

    try {
      // Check if order exists and is still in SHIPPED status
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          status: true,
          userId: true,
          updatedAt: true,
        },
      });

      if (!order) {
        logger.warn(`Auto-confirm: Order ${orderId} not found`);
        return;
      }

      if (order.status !== "SHIPPED") {
        logger.info(
          `Auto-confirm: Order ${orderId} status is ${order.status}, skipping auto-confirmation`
        );
        return;
      }

      // Check if 7 days have passed since the order was shipped
      const now = new Date();
      const shippedAt = new Date(order.updatedAt);
      const daysSinceShipped =
        (now.getTime() - shippedAt.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceShipped < 7) {
        logger.info(
          `Auto-confirm: Order ${orderId} shipped only ${daysSinceShipped.toFixed(
            1
          )} days ago, rescheduling`
        );
        // Reschedule for the remaining time
        const remainingMs = (7 - daysSinceShipped) * 24 * 60 * 60 * 1000;
        throw new Error(`Reschedule in ${remainingMs}ms`);
      }

      // Update order status to CONFIRMED
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "CONFIRMED",
          updatedAt: now,
        },
      });

      logger.info(`✅ Auto-confirmed order ${orderId} after 7 days`);
    } catch (error) {
      logger.error(
        `❌ Error in auto-confirmation for order ${orderId}:`,
        error
      );
      throw error; // Let BullMQ handle retries
    }
  },
  {
    connection: redis,
    concurrency: 5,
  }
);

autoConfirmWorker.on("completed", (job) => {
  logger.info(`Auto-confirmation job completed for order ${job.data.orderId}`);
});

autoConfirmWorker.on("failed", (job, err) => {
  logger.error(
    `Auto-confirmation job failed for order ${job?.data?.orderId}:`,
    err
  );
});

export default autoConfirmWorker;
