import { prisma } from "@repo/database";
import { ERROR_MESSAGES } from "../utils/helpers.js";
import { createValidationError, createNotFoundError } from "../errors/app.error.js";
import type { Prisma } from "@repo/database/generated/prisma/index.js";

type OrderItemInput = { productId: number; qty: number };

export class InventoryService {
//cart operations
  async checkCartStock(storeId: number, productId: number, qty: number) {
    // First check if product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    
    if (!product) {
      throw createNotFoundError("Product");
    }
    
    if (!product.isActive) {
      throw createValidationError(ERROR_MESSAGES.PRODUCT.NOT_AVAILABLE);
    }

    const inventory = await prisma.storeInventory.findUnique({
      where: { storeId_productId: { storeId, productId } },
    });
    
    if (!inventory) {
      throw createValidationError(ERROR_MESSAGES.PRODUCT.NOT_IN_STORE);
    }
    
    if (inventory.stockQty < qty) {
      throw createValidationError(
        `${ERROR_MESSAGES.INVENTORY.INSUFFICIENT_STOCK}. Available: ${inventory.stockQty}`
      );
    }

    return inventory;
  }
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

  async transferInventory(
    fromStoreId: number,
    toStoreId: number,
    items: Array<{ productId: number; qty: number }>,
    userId: number,
    note?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const executeTransfer = async (transaction: Prisma.TransactionClient) => {
      // Validate source store has enough stock
      for (const item of items) {
        const sourceInventory = await transaction.storeInventory.findFirst({
          where: { storeId: fromStoreId, productId: item.productId },
        });

        if (!sourceInventory || sourceInventory.stockQty < item.qty) {
          throw new Error(
            `Insufficient stock for product ID ${item.productId} in source store. Available: ${sourceInventory?.stockQty || 0}`
          );
        }
      }

      // Process transfers
      for (const item of items) {
        // Decrease from source store
        await transaction.storeInventory.updateMany({
          where: { storeId: fromStoreId, productId: item.productId },
          data: { stockQty: { decrement: item.qty } },
        });

        // Create outbound journal entry
        await transaction.stockJournal.create({
          data: {
            storeId: fromStoreId,
            productId: item.productId,
            qtyChange: -item.qty,
            reason: "TRANSFER_OUT",
            note: note || null,
            adminId: userId,
          },
        });

        // Increase in destination store (upsert to handle non-existing inventory)
        await transaction.storeInventory.upsert({
          where: {
            storeId_productId: {
              storeId: toStoreId,
              productId: item.productId,
            },
          },
          update: {
            stockQty: { increment: item.qty },
          },
          create: {
            storeId: toStoreId,
            productId: item.productId,
            stockQty: item.qty,
          },
        });

        // Create inbound journal entry
        await transaction.stockJournal.create({
          data: {
            storeId: toStoreId,
            productId: item.productId,
            qtyChange: item.qty,
            reason: "TRANSFER_IN",
            note: note || null,
            adminId: userId,
          },
        });
      }
    };

    if (tx) {
      await executeTransfer(tx);
    } else {
      await prisma.$transaction(executeTransfer);
    }
  }

  async getStoreInventories(storeId: number, page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;
    
    const where = {
      storeId,
      ...(search && {
        product: {
          name: {
            contains: search,
            mode: 'insensitive' as const,
          },
        },
      }),
    };

    const [inventories, total] = await Promise.all([
      prisma.storeInventory.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              images: true,
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          product: {
            name: 'asc',
          },
        },
      }),
      prisma.storeInventory.count({ where }),
    ]);

    return {
      inventories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStockJournals(
    storeId?: number,
    page: number = 1,
    limit: number = 10,
    productId?: number,
    reason?: string,
    startDate?: string,
    endDate?: string
  ) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (storeId) where.storeId = storeId;
    if (productId) where.productId = productId;
    if (reason) where.reason = reason;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [journals, total] = await Promise.all([
      prisma.stockJournal.findMany({
        where,
        include: {
          product: {
            select: {
              name: true,
            },
          },
          store: {
            select: {
              name: true,
            },
          },
          admin: {
            select: {
              email: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.stockJournal.count({ where }),
    ]);

    return {
      journals,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const inventoryService = new InventoryService();
