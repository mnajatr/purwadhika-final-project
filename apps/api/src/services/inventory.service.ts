import { prisma } from "@repo/database";
import { ERROR_MESSAGES } from "../utils/helpers.js";
import type { Prisma } from "@repo/database/generated/prisma/index.js";

type OrderItemInput = { productId: number; qty: number };

export class InventoryService {
  /**
   * Validate inventory availability for order items
   * @param storeId - Store ID to check inventory for
   * @param items - Array of order items to validate
   * @returns Promise that resolves if inventory is sufficient, throws otherwise
   */
  async validateInventoryAvailability(
    storeId: number,
    items: OrderItemInput[]
  ): Promise<void> {
    const productIds = items.map((item) => item.productId);
    
    const inventories = await prisma.storeInventory.findMany({
      where: { storeId, productId: { in: productIds } },
    });

    // Ensure all requested products have inventory
    for (const item of items) {
      const inventory = inventories.find((inv) => inv.productId === item.productId);
      if (!inventory) {
        throw new Error(ERROR_MESSAGES.INVENTORY.NO_INVENTORY);
      }
      if (inventory.stockQty < item.qty) {
        throw new Error(
          `${ERROR_MESSAGES.INVENTORY.INSUFFICIENT_STOCK}. Available: ${inventory.stockQty}`
        );
      }
    }
  }

  /**
   * Reserve inventory for order items (decrement stock and create journal entries)
   * @param storeId - Store ID
   * @param orderId - Order ID for journal reference
   * @param items - Array of order items
   * @param userId - User ID for journal entries
   * @param tx - Prisma transaction client
   */
  async reserveInventory(
    storeId: number,
    orderId: number,
    items: OrderItemInput[],
    userId: number,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    const productIds = items.map((item) => item.productId);
    
    // Lock inventories for update by reading them
    const inventories = await tx.storeInventory.findMany({
      where: { storeId, productId: { in: productIds } },
    });

    for (const item of items) {
      const inventory = inventories.find((inv) => inv.productId === item.productId);
      if (!inventory) {
        throw new Error(ERROR_MESSAGES.INVENTORY.NO_INVENTORY);
      }

      // Perform conditional atomic decrement to avoid oversell
      const updateRes = await tx.storeInventory.updateMany({
        where: { id: inventory.id, stockQty: { gte: item.qty } },
        data: { stockQty: { decrement: item.qty } },
      });

      if (updateRes.count === 0) {
        throw new Error(
          `${ERROR_MESSAGES.INVENTORY.INSUFFICIENT_STOCK}. Available: ${inventory.stockQty}`
        );
      }

      // Record stock journal for the decrement
      await tx.stockJournal.create({
        data: {
          storeId: inventory.storeId,
          productId: inventory.productId,
          qtyChange: -item.qty,
          reason: "REMOVE",
          adminId: userId,
        },
      });
    }
  }

  /**
   * Restore inventory when order is cancelled
   * @param storeId - Store ID
   * @param items - Array of order items to restore
   * @param userId - User ID for journal entries
   * @param tx - Prisma transaction client
   */
  async restoreInventory(
    storeId: number,
    items: Array<{ productId: number; qty: number }>,
    userId: number,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    for (const item of items) {
      await tx.storeInventory.updateMany({
        where: { storeId: storeId, productId: item.productId },
        data: { stockQty: { increment: item.qty } },
      });

      await tx.stockJournal.create({
        data: {
          storeId: storeId,
          productId: item.productId,
          qtyChange: item.qty,
          reason: "ADD",
          adminId: userId,
        },
      });
    }
  }
}

export const inventoryService = new InventoryService();
