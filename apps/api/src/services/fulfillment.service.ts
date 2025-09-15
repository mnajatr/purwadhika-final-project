import { prisma } from "@repo/database";
import { createConflictError } from "../errors/app.error.js";
import { rollbackService } from "./rollback.service.js";

export class FulfillmentService {
  async shipOrder(orderId: number, actorUserId?: number) {
    const logger = (await import("../utils/logger.js")).default;
  const allowedPrev = ["PROCESSING"];

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

  async confirmOrder(orderId: number, requesterUserId?: number, actorId?: number) {
    const logger = (await import("../utils/logger.js")).default;

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId }, include: { payment: true } });
      if (!order) throw new Error("Order not found");

      if (requesterUserId && order.userId !== requesterUserId) {
        throw new Error("Cannot confirm: not order owner");
      }

      // Two confirmation flows:
      // 1) User confirms receipt -> must be SHIPPED -> becomes CONFIRMED
      // 2) Admin confirms payment proof -> must be PAYMENT_REVIEW -> becomes PROCESSING

      if (!requesterUserId) {
        // Admin action
  if (order.status === "PAYMENT_REVIEW") {
          // Mark payment as PAID and advance order to PROCESSING
          if (order.payment) {
            await tx.payment.update({
              where: { id: order.payment.id },
              data: {
                status: "PAID",
                reviewedAt: new Date(),
    paidAt: new Date(),
    reviewedByAdminId: actorId ?? undefined,
              },
            });
          }

          return tx.order.update({ where: { id: orderId }, data: { status: "PROCESSING" } });
        }
        // Otherwise fall through to check user confirmation rules below
      }

      // User confirmation flow
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

    // Remove any scheduled auto-confirm or cancel jobs that are no longer relevant.
    try {
      const { orderConfirmQueue } = await import(
        "../queues/orderConfirmQueue.js"
      );
      const job = await orderConfirmQueue.getJob(String(orderId));
      if (job) await job.remove();
    } catch (e) {
      logger.error(`Failed to remove confirm job for order=${orderId}: %o`, e);
    }

    try {
      const { cancelAutoConfirmation } = await import(
        "../queues/autoConfirmQueue.js"
      );
      await cancelAutoConfirmation(orderId);
      logger.info(
        `Cancelled auto-confirmation for order ${orderId}`
      );
    } catch (e) {
      logger.error(`Failed to cancel auto-confirmation for order=${orderId}: %o`, e);
    }

    // Also remove any scheduled cancellation (payment deadline) since payment may now be accepted
    try {
      const { orderCancelQueue } = await import(
        "../queues/orderCancelQueue.js"
      );
      const cj = await orderCancelQueue.getJob(String(orderId));
      if (cj) await cj.remove();
    } catch (e) {
      logger.error(`Failed to remove cancel job for order=${orderId}: %o`, e);
    }

    return result;
  }

  /**
   * Cancel order.
   * - User → hanya boleh cancel jika status = PENDING_PAYMENT
   * - Admin → boleh cancel jika status belum SHIPPED/CONFIRMED
   */
  async cancelOrder(orderId: number, requesterUserId?: number, actorId?: number) {
    const logger = (await import("../utils/logger.js")).default;

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true, payment: true },
      });
      if (!order) throw new Error("Order not found");

      // Check whether this is an admin action (requesterUserId omitted)
      const isAdmin = !requesterUserId;

      if (!isAdmin) {
        // === USER cancel === only allowed when PENDING_PAYMENT
        if (order.userId !== requesterUserId) {
          throw new Error("Cannot cancel: not order owner");
        }
        if (order.status !== "PENDING_PAYMENT") {
          throw createConflictError(
            `Cannot cancel order: current status is ${order.status}`
          );
        }

        // Rollback stock/voucher/coupon etc and mark CANCELLED
        await rollbackService.rollbackOrderInTransaction(order, tx);

        return tx.order.update({
          where: { id: orderId },
          data: { status: "CANCELLED" },
        });
      }

      // === ADMIN cancel ===
      // If admin rejects a payment under review, we should set payment->REJECTED
      // and revert order status to PENDING_PAYMENT so user can re-upload proof.
      if (order.status === "PAYMENT_REVIEW" && order.payment) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: { status: "REJECTED", reviewedAt: new Date(), reviewedByAdminId: actorId ?? undefined },
        });

        // revert order status to PENDING_PAYMENT
        const reverted = await tx.order.update({
          where: { id: orderId },
          data: { status: "PENDING_PAYMENT" },
        });

        // Reschedule auto-cancellation (deadline) so the user has another window to upload
        // This is done outside the transaction by caller _removeScheduledCancellation => schedule in outer scope
        return reverted;
      }

      // For other admin cancellations (not allowed if shipped/confirmed)
      if (["SHIPPED", "CONFIRMED"].includes(order.status)) {
        throw createConflictError(
          `Admin cannot cancel order in status ${order.status}`
        );
      }

      // Rollback stock/voucher/coupon etc and cancel
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

    // If the admin rejected a payment (we reverted to PENDING_PAYMENT),
    // schedule a new cancel job so payment deadline is enforced again.
    try {
      if (result && (result as any).status === "PENDING_PAYMENT") {
        const ORDER_CANCEL_DELAY_MS = Number(process.env.ORDER_CANCEL_DELAY_MS) || 60 * 60 * 1000;
        const { orderCancelQueue } = await import("../queues/orderCancelQueue.js");
        await orderCancelQueue.add(
          "cancel-order",
          { orderId },
          { jobId: String(orderId), delay: ORDER_CANCEL_DELAY_MS }
        );
        logger.info(`Scheduled cancel job for order=${orderId} (delay=${ORDER_CANCEL_DELAY_MS}ms)`);
      }
    } catch (e) {
      logger.error(`Failed to schedule cancel job for order=${orderId}: %o`, e);
    }

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
