import { prisma } from "@repo/database";
import { createConflictError } from "../errors/app.error.js";
import { inventoryService } from "./inventory.service.js";
import { rollbackService } from "./index.js";

/**
 * Fulfillment Service - Handles order lifecycle and status transitions
 * Responsible for: shipping, confirmation, cancellation, and job scheduling
 */
export class FulfillmentService {
  /**
   * Ship an order and schedule auto-confirmation
   * @param orderId - Order ID to ship
   * @param actorUserId - User performing the action
   * @returns Updated order
   */
  async shipOrder(orderId: number, actorUserId?: number) {
    const logger = (await import("../utils/logger.js")).default;
    const allowedPrev = ["PAYMENT_REVIEW", "PROCESSING"];

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new Error("Order not found");

      if (!allowedPrev.includes(order.status)) {
        throw new Error(`Cannot ship order: current status is ${order.status}`);
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: "SHIPPED" },
      });

      return updated;
    });

    // Enqueue confirm job with delay (default 48 hours)
    try {
      const { orderConfirmQueue } = await import("../queues/orderConfirmQueue.js");
      const DELAY_MS = Number(process.env.ORDER_CONFIRM_DELAY_MS) || 48 * 60 * 60 * 1000;
      
      await orderConfirmQueue.add(
        "confirm-order",
        { orderId },
        { jobId: String(orderId), delay: DELAY_MS }
      );
    } catch (e) {
      try {
        logger.error(`Failed to enqueue confirm job for order=${orderId}: %o`, e);
      } catch (ee) {
        // swallow
      }
    }

    logger.info(`Order ${orderId} marked SHIPPED by user=${actorUserId ?? "system"}`);
    return result;
  }

  /**
   * Confirm order delivery manually
   * @param orderId - Order ID to confirm
   * @param requesterUserId - User requesting confirmation (must be order owner)
   * @returns Updated order
   */
  async confirmOrder(orderId: number, requesterUserId?: number) {
    const logger = (await import("../utils/logger.js")).default;

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new Error("Order not found");

      // If requesterUserId provided, enforce ownership in production
      if (requesterUserId && order.userId !== requesterUserId) {
        throw new Error("Cannot confirm: not order owner");
      }

      if (order.status !== "SHIPPED") {
        throw new Error(`Cannot confirm order: current status is ${order.status}`);
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: "CONFIRMED" },
      });
      return updated;
    });

    // If there was a scheduled confirm job, remove it
    try {
      const { orderConfirmQueue } = await import("../queues/orderConfirmQueue.js");
      const job = await orderConfirmQueue.getJob(String(orderId));
      if (job) await job.remove();
    } catch (e) {
      try {
        logger.error(`Failed to remove confirm job for order=${orderId}: %o`, e);
      } catch (ee) {
        // swallow
      }
    }

    logger.info(`Order ${orderId} confirmed by user=${requesterUserId ?? "system"}`);
    return result;
  }

  /**
   * Cancel an order and trigger rollback
   * @param orderId - Order ID to cancel
   * @param requesterUserId - User requesting cancellation (must be order owner)
   * @returns Updated order
   */
  async cancelOrder(orderId: number, requesterUserId: number) {
    const logger = (await import("../utils/logger.js")).default;

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true, payment: true },
      });

      if (!order) throw new Error("Order not found");

      if (order.userId !== requesterUserId) {
        throw new Error("Cannot cancel: not order owner");
      }

      if (order.status !== "PENDING_PAYMENT") {
        throw createConflictError(
          `Cannot cancel order: current status is ${order.status}`
        );
      }

      // Use rollback service for compensation
      await rollbackService.rollbackOrderInTransaction(order, tx);

      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });

      return updated;
    });

    // Remove any scheduled auto-cancel job for this order
    await this._removeScheduledCancellation(orderId);

    logger.info(`Order ${orderId} cancelled manually by user=${requesterUserId}`);
    return result;
  }

  /**
   * Remove scheduled auto-cancellation job
   * @private
   */
  private async _removeScheduledCancellation(orderId: number): Promise<void> {
    try {
      const { orderCancelQueue } = await import("../queues/orderCancelQueue.js");
      const job = await orderCancelQueue.getJob(String(orderId));
      if (job) await job.remove();
    } catch (err) {
      try {
        const logger = (await import("../utils/logger.js")).default;
        logger.error(`Failed to remove cancel job for order=${orderId}: %o`, err);
      } catch (e) {
        // swallow
      }
    }
  }
}

export const fulfillmentService = new FulfillmentService();
