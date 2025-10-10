import { Router } from "express";
import { Receiver } from "@upstash/qstash";
import { prisma } from "../configs/prisma.config.js";
import logger from "../utils/logger.js";
import type { ConfirmOrderJobData } from "../queues/orderConfirmQueue.js";

const QSTASH_CURRENT_SIGNING_KEY = process.env.QSTASH_CURRENT_SIGNING_KEY;
const QSTASH_NEXT_SIGNING_KEY = process.env.QSTASH_NEXT_SIGNING_KEY;

const router = Router();

/**
 * Process order confirmation job.
 * This handler is called by QStash when a scheduled message is delivered.
 */
async function processConfirmOrder(data: ConfirmOrderJobData) {
  const { orderId } = data;
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

      const now = new Date();

      // Update order status to CONFIRMED
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: "CONFIRMED" },
      });

      // Update shipment with deliveredAt timestamp
      const shipment = await tx.shipment.findUnique({ where: { orderId } });
      if (shipment) {
        await tx.shipment.update({
          where: { orderId },
          data: {
            status: "DELIVERED",
            deliveredAt: now,
          },
        });
        logger.info(`Updated shipment deliveredAt for order ${orderId}`);
      } else {
        logger.warn(
          `No shipment record found for order ${orderId} during auto-confirm`
        );
      }

      return { skipped: false, updated };
    });

    logger.info(
      `✅ Confirm job done for order=${orderId}: ${JSON.stringify(result)}`
    );
    return result;
  } catch (err) {
    logger.error(`❌ Failed confirm job for order=${orderId}: ${String(err)}`);
    throw err;
  }
}

// QStash webhook endpoint for order confirmation
router.post("/order-confirm", async (req, res) => {
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
      logger.error("Invalid QStash signature for order confirm");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const data = req.body as ConfirmOrderJobData;
    logger.info(`🎉 Order confirm job received: ${JSON.stringify(data)}`);

    await processConfirmOrder(data);

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error(`❌ Order confirm webhook error: ${String(error)}`);
    res.status(500).json({ error: "Failed to process job" });
  }
});

export default router;
