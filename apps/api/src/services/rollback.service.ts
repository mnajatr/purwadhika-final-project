import { prisma } from "@repo/database";
import { inventoryService } from "./inventory.service.js";
import type { Prisma } from "@repo/database/generated/prisma/index.js";

/**
 * Rollback Service - Handles order cancellation compensation
 * Responsible for: inventory restoration, voucher rollback, audit logging
 */
export class RollbackService {
  /**
   * Rollback order within a transaction
   * @param order - Order with items to rollback
   * @param tx - Prisma transaction client
   */
  async rollbackOrderInTransaction(
    order: any, // Order with items included
    tx: Prisma.TransactionClient
  ): Promise<void> {
    // Restore inventory
    await inventoryService.restoreInventory(
      order.storeId,
      order.items,
      order.userId,
      tx
    );

    // Rollback vouchers if applicable
    await this._rollbackVouchers(order.userId, order.createdAt, tx);
  }

  /**
   * Rollback an order (public interface)
   * @param orderId - Order ID to rollback
   * @param opts - Options with actor and reason
   * @returns Rollback result
   */
  async rollbackOrder(
    orderId: number,
    opts?: { actorId?: number; reason?: string }
  ): Promise<{ success: boolean; details: any }> {
    const logger = (await import("../utils/logger.js")).default;

    try {
      const result = await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: { items: true },
        });

        if (!order) {
          throw new Error("Order not found");
        }

        await this.rollbackOrderInTransaction(order, tx);

        return { order, success: true };
      });

      logger.info(
        `Order ${orderId} rolled back by user=${opts?.actorId ?? "system"} reason=${opts?.reason ?? "unknown"}`
      );

      return {
        success: true,
        details: {
          orderId,
          inventoryRestored: true,
          voucherRolledBack: true,
          actor: opts?.actorId,
          reason: opts?.reason,
        },
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to rollback order ${orderId}: ${msg}`);
      
      return {
        success: false,
        details: { orderId, error: msg },
      };
    }
  }

  /**
   * Handle voucher rollback when cancelling orders
   * @private
   */
  private async _rollbackVouchers(
    userId: number,
    orderCreatedAt: Date | null,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    const logger = (await import("../utils/logger.js")).default;
    
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
            where: { id: { in: usedVouchers.map((v) => v.id) } },
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
}

export const rollbackService = new RollbackService();
