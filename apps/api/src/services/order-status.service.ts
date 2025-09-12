import { prisma } from "@repo/database";
import { createConflictError } from "../errors/app.error.js";
import { inventoryService } from "./inventory.service.js";

export class OrderStatusService {
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
   * Cancel an order and restore inventory
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

      // Restore stock and create stock journal entries
      await inventoryService.restoreInventory(
        order.storeId,
        order.items,
        order.userId,
        tx
      );

      // Rollback vouchers/coupons if schema tracks them
      await this._rollbackVouchers(order.userId, order.createdAt, tx, logger);

      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });

      return updated;
    });

    // Remove any scheduled auto-cancel job for this order
    try {
      const { orderCancelQueue } = await import("../queues/orderCancelQueue.js");
      const job = await orderCancelQueue.getJob(String(orderId));
      if (job) await job.remove();
    } catch (err) {
      try {
        logger.error(`Failed to remove cancel job for order=${orderId}: %o`, err);
      } catch (e) {
        // swallow
      }
    }

    logger.info(`Order ${orderId} cancelled manually by user=${requesterUserId}`);
    return result;
  }

  /**
   * Handle voucher rollback when cancelling orders
   * @private
   */
  private async _rollbackVouchers(
    userId: number,
    orderCreatedAt: Date | null,
    tx: any,
    logger: any
  ): Promise<void> {
    try {
      if (orderCreatedAt) {
        const windowMs = 10 * 60 * 1000; // 10 minutes window
        const from = new Date(orderCreatedAt.getTime() - windowMs);
        const to = new Date(orderCreatedAt.getTime() + windowMs);

        const usedVouchers = await tx.voucher.findMany({
          where: {
            userId: userId,
            isUsed: true,
            usedAt: { gte: from, lte: to },
          },
        });

        if (usedVouchers.length > 0) {
          await tx.voucher.updateMany({
            where: { id: { in: usedVouchers.map((v: any) => v.id) } },
            data: { isUsed: false, usedAt: null },
          });
          
          logger.info(`[TX] Rolled back ${usedVouchers.length} voucher(s) for user=${userId}`);
        }
      }
    } catch (e) {
      // Swallow voucher rollback errors to avoid failing the whole transaction
      logger.warn(`Voucher rollback skipped for user=${userId}: %o`, e);
    }
  }

  /**
   * Schedule automatic order cancellation
   * @param orderId - Order ID to schedule cancellation for
   * @param delayMs - Delay in milliseconds before cancellation
   */
  async scheduleAutoCancellation(orderId: number, delayMs: number): Promise<void> {
    try {
      const { orderCancelQueue } = await import("../queues/orderCancelQueue.js");
      
      await orderCancelQueue.add(
        "cancel-order",
        { orderId },
        { jobId: String(orderId), delay: delayMs }
      );
    } catch (err) {
      // Don't fail order creation due to queue issues; log error
      try {
        const logger = (await import("../utils/logger.js")).default;
        logger.error(`Failed to enqueue cancel job for order=${orderId}: %o`, err);
      } catch (e) {
        // swallow logging errors
      }
    }
  }

  /**
   * Remove scheduled auto-cancellation job
   * @param orderId - Order ID to remove cancellation job for
   */
  async removeScheduledCancellation(orderId: number): Promise<void> {
    try {
      const { orderCancelQueue } = await import("../queues/orderCancelQueue.js");
      const job = await orderCancelQueue.getJob(String(orderId));
      if (job) {
        await job.remove();
        const logger = (await import("../utils/logger.js")).default;
        logger.info(`Removed cancel job for order=${orderId}`);
      }
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

export const orderStatusService = new OrderStatusService();
