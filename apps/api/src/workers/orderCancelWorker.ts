import { Worker, Job } from "bullmq";
import { prisma } from "@repo/database";
import logger from "../utils/logger.js";
import {
  ORDER_CANCEL_QUEUE_NAME,
  type CancelOrderJobData,
} from "../queues/orderCancelQueue.js";
import { redis } from "../configs/redis.config.js";

logger.info("✅ Order cancel worker is running...");

const worker = new Worker<CancelOrderJobData>(
  ORDER_CANCEL_QUEUE_NAME,
  async (job: Job<CancelOrderJobData>) => {
    const { orderId } = job.data;
    logger.info(`🚀 Starting cancel job for order=${orderId}`);

    try {
      const result = await prisma.$transaction(async (tx) => {
        logger.info(`[TX] Looking up order ${orderId}...`);
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: { items: true, payment: true },
        });

        if (!order) {
          logger.warn(`[TX] Order ${orderId} not found, skipping`);
          return { skipped: true };
        }

        logger.info(`[TX] Order ${orderId} current status: ${order.status}`);
        if (order.status !== "PENDING_PAYMENT") {
          logger.info(`[TX] Order ${orderId} not pending, skipping cancel`);
          return { skipped: true };
        }

        logger.info(`[TX] Restoring stock for ${order.items.length} items...`);
        for (const item of order.items) {
          logger.info(
            `[TX] Restoring productId=${item.productId}, qty=${item.qty}`
          );

          const updateRes = await tx.storeInventory.updateMany({
            where: { storeId: order.storeId, productId: item.productId },
            data: { stockQty: { increment: item.qty } },
          });
          logger.info(
            `[TX] Updated inventory for productId=${item.productId}, count=${updateRes.count}`
          );

          await tx.stockJournal.create({
            data: {
              storeId: order.storeId,
              productId: item.productId,
              qtyChange: item.qty,
              reason: "ADD",
              adminId: order.userId,
            },
          });
          logger.info(
            `[TX] Stock journal created for productId=${item.productId}`
          );
        }

        // Best-effort voucher rollback: try to find vouchers used by this user
        // around the order creation time and mark them unused again. This is
        // best-effort and should not abort the cancel TX if voucher table
        // is missing or query fails.
        try {
          if (order.createdAt) {
            const windowMs = 10 * 60 * 1000; // 10 minutes window
            const from = new Date(order.createdAt.getTime() - windowMs);
            const to = new Date(order.createdAt.getTime() + windowMs);

            const usedVouchers = await tx.voucher.findMany({
              where: {
                userId: order.userId,
                isUsed: true,
                usedAt: { gte: from, lte: to },
              },
            });

            if (usedVouchers.length > 0) {
              await tx.voucher.updateMany({
                where: { id: { in: usedVouchers.map((v) => v.id) } },
                data: { isUsed: false, usedAt: null },
              });
              logger.info(
                `[TX] Rolled back ${usedVouchers.length} voucher(s) for order=${orderId}`
              );
            }
          }
        } catch (e) {
          // swallow voucher rollback errors to avoid failing the whole TX for
          // unexpected schema differences; log the error for later debugging.
          try {
            logger.warn(`Voucher rollback skipped for order=${orderId}: %o`, e);
          } catch (ee) {
            // swallow
          }
        }

        logger.info(`[TX] Updating order ${orderId} status to CANCELLED...`);
        const updated = await tx.order.update({
          where: { id: orderId },
          data: { status: "CANCELLED" },
        });

        // Update payment status to FAILED if payment exists
        if (order.payment) {
          logger.info(
            `[TX] Updating payment status to FAILED for order ${orderId}...`
          );
          await tx.payment.update({
            where: { id: order.payment.id },
            data: { status: "FAILED" },
          });
          logger.info(
            `[TX] Payment status updated to FAILED for order ${orderId}`
          );
        }

        logger.info(
          `[TX] Order ${orderId} status updated to ${updated.status}`
        );
        return { skipped: false, updated };
      });

      logger.info(
        `✅ Cancel job done for order=${orderId}: ${JSON.stringify(result)}`
      );
      return result;
    } catch (err) {
      logger.error(`❌ Failed cancel job for order=${orderId}: ${String(err)}`);
      throw err;
    }
  },
  { connection: redis }
);

worker.on("failed", (job: Job<CancelOrderJobData> | undefined, err: Error) => {
  logger.error(
    `❌ Order cancel job failed. id=${job?.id} data=${JSON.stringify(
      job?.data
    )} error=${String(err)}`
  );
});

worker.on("completed", (job: Job<CancelOrderJobData>) => {
  logger.info(
    `🎉 Order cancel job completed. id=${job.id} data=${JSON.stringify(
      job.data
    )}`
  );
});

export default worker;
