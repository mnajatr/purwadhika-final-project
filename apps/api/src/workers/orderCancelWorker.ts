import { Router } from "express";
import { Receiver } from "@upstash/qstash";
import { prisma } from "../configs/prisma.config.js";
import logger from "../utils/logger.js";
import type { CancelOrderJobData } from "../queues/orderCancelQueue.js";

const QSTASH_CURRENT_SIGNING_KEY = process.env.QSTASH_CURRENT_SIGNING_KEY;
const QSTASH_NEXT_SIGNING_KEY = process.env.QSTASH_NEXT_SIGNING_KEY;

const router = Router();

/**
 * Process order cancellation job.
 * This handler is called by QStash when a scheduled message is delivered.
 */
async function processCancelOrder(data: CancelOrderJobData) {
  const { orderId } = data;
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

      // Best-effort voucher rollback
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

      logger.info(`[TX] Order ${orderId} status updated to ${updated.status}`);
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
}

// QStash webhook endpoint for order cancellation
router.post("/order-cancel", async (req, res) => {
  try {
    if (!QSTASH_CURRENT_SIGNING_KEY || !QSTASH_NEXT_SIGNING_KEY) {
      logger.error("QStash signing keys not configured");
      return res.status(500).json({ error: "QStash not configured" });
    }

    const receiver = new Receiver({
      currentSigningKey: QSTASH_CURRENT_SIGNING_KEY,
      nextSigningKey: QSTASH_NEXT_SIGNING_KEY,
    });

    const signature = req.headers["upstash-signature"] as string;
    const body = JSON.stringify(req.body);

    // Verify the request is from QStash
    const isValid = await receiver.verify({
      signature,
      body,
    });

    if (!isValid) {
      logger.error("Invalid QStash signature for order cancel");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const data = req.body as CancelOrderJobData;
    logger.info(`🎉 Order cancel job received: ${JSON.stringify(data)}`);

    await processCancelOrder(data);

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error(`❌ Order cancel webhook error: ${String(error)}`);
    res.status(500).json({ error: "Failed to process job" });
  }
});

export default router;
