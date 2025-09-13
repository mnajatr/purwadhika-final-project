import { prisma } from "@repo/database";
import { createConflictError } from "../errors/app.error.js";
import { rollbackService } from "./rollback.service.js";

export class FulfillmentService {
  async shipOrder(orderId: number, actorUserId?: number) {
    const logger = (await import("../utils/logger.js")).default;
    const allowedPrev = ["PAYMENT_REVIEW", "PROCESSING"];

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new Error("Order not found");

      if (!allowedPrev.includes(order.status)) {
        throw new Error(`Cannot ship order: current status is ${order.status}`);
      }

      return tx.order.update({
        where: { id: orderId },
        data: { status: "SHIPPED" },
      });
    });

    try {
      const { orderConfirmQueue } = await import(
        "../queues/orderConfirmQueue.js"
      );
      const DELAY_MS =
        Number(process.env.ORDER_CONFIRM_DELAY_MS) || 48 * 60 * 60 * 1000;
      await orderConfirmQueue.add(
        "confirm-order",
        { orderId },
        { jobId: String(orderId), delay: DELAY_MS }
      );
    } catch (e) {
      const logger = (await import("../utils/logger.js")).default;
      logger.error(`Failed to enqueue confirm job for order=${orderId}: %o`, e);
    }

    // Schedule auto-confirmation after 7 days
    try {
      const { scheduleAutoConfirmation } = await import(
        "../queues/autoConfirmQueue.js"
      );
      const AUTO_CONFIRM_DELAY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
      await scheduleAutoConfirmation(orderId, AUTO_CONFIRM_DELAY_MS);
      logger.info(`Scheduled auto-confirmation for order ${orderId} in 7 days`);
    } catch (e) {
      logger.error(
        `Failed to schedule auto-confirmation for order=${orderId}: %o`,
        e
      );
    }

    return result;
  }

  async confirmOrder(orderId: number, requesterUserId?: number) {
    const logger = (await import("../utils/logger.js")).default;

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new Error("Order not found");

      if (requesterUserId && order.userId !== requesterUserId) {
        throw new Error("Cannot confirm: not order owner");
      }

      if (order.status !== "SHIPPED") {
        throw new Error(
          `Cannot confirm order: current status is ${order.status}`
        );
      }

      return tx.order.update({
        where: { id: orderId },
        data: { status: "CONFIRMED" },
      });
    });

    try {
      const { orderConfirmQueue } = await import(
        "../queues/orderConfirmQueue.js"
      );
      const job = await orderConfirmQueue.getJob(String(orderId));
      if (job) await job.remove();
    } catch (e) {
      const logger = (await import("../utils/logger.js")).default;
      logger.error(`Failed to remove confirm job for order=${orderId}: %o`, e);
    }

    // Cancel auto-confirmation since user manually confirmed
    try {
      const { cancelAutoConfirmation } = await import(
        "../queues/autoConfirmQueue.js"
      );
      await cancelAutoConfirmation(orderId);
      logger.info(
        `Cancelled auto-confirmation for manually confirmed order ${orderId}`
      );
    } catch (e) {
      logger.error(
        `Failed to cancel auto-confirmation for order=${orderId}: %o`,
        e
      );
    }

    return result;
  }

  /**
   * Cancel order.
   * - User → hanya boleh cancel jika status = PENDING_PAYMENT
   * - Admin → boleh cancel jika status belum SHIPPED/CONFIRMED
   */
  async cancelOrder(orderId: number, requesterUserId?: number) {
    const logger = (await import("../utils/logger.js")).default;

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true, payment: true },
      });
      if (!order) throw new Error("Order not found");

      // Cek apakah ini request dari admin
      const isAdmin = !requesterUserId;

      if (!isAdmin) {
        // === USER cancel ===
        if (order.userId !== requesterUserId) {
          throw new Error("Cannot cancel: not order owner");
        }
        if (order.status !== "PENDING_PAYMENT") {
          throw createConflictError(
            `Cannot cancel order: current status is ${order.status}`
          );
        }
      } else {
        // === ADMIN cancel ===
        if (["SHIPPED", "CONFIRMED"].includes(order.status)) {
          throw createConflictError(
            `Admin cannot cancel order in status ${order.status}`
          );
        }
      }

      // Rollback stock/voucher/coupon dll
      await rollbackService.rollbackOrderInTransaction(order, tx);

      return tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });
    });

    await this._removeScheduledCancellation(orderId);
    logger.info(
      `Order ${orderId} cancelled by ${
        requesterUserId ? `user=${requesterUserId}` : "admin"
      }`
    );
    return result;
  }

  private async _removeScheduledCancellation(orderId: number): Promise<void> {
    try {
      const { orderCancelQueue } = await import(
        "../queues/orderCancelQueue.js"
      );
      const job = await orderCancelQueue.getJob(String(orderId));
      if (job) await job.remove();
    } catch (err) {
      const logger = (await import("../utils/logger.js")).default;
      logger.error(`Failed to remove cancel job for order=${orderId}: %o`, err);
    }
  }
}

export const fulfillmentService = new FulfillmentService();
