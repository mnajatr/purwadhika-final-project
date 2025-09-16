import { Request, Response } from "express";
import { inventoryService } from "../services/inventory.service.js";
import { validationResult } from "express-validator";
import { prisma } from "@repo/database";

export class InventoryController {
  async getStoreInventories(req: Request, res: Response) {
    try {
      const { storeId } = req.params;
      const { page = 1, limit = 10, search } = req.query;

      const result = await inventoryService.getStoreInventories(
        parseInt(storeId),
        parseInt(page as string),
        parseInt(limit as string),
        search as string
      );

      res.json({
        status: "success",
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  async transferInventory(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { fromStoreId, toStoreId, items } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          status: "error",
          message: "User not authenticated",
        });
      }

      await inventoryService.transferInventory(
        fromStoreId,
        toStoreId,
        items,
        userId
      );

      res.json({
        status: "success",
        message: "Inventory transferred successfully",
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  async getStockJournals(req: Request, res: Response) {
    try {
      const { 
        storeId, 
        page = 1, 
        limit = 10, 
        productId, 
        reason, 
        startDate, 
        endDate 
      } = req.query;

      const result = await inventoryService.getStockJournals(
        storeId ? parseInt(storeId as string) : undefined,
        parseInt(page as string),
        parseInt(limit as string),
        productId ? parseInt(productId as string) : undefined,
        reason as string,
        startDate as string,
        endDate as string
      );

      res.json({
        status: "success",
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  async updateStockManual(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { storeId, productId, qtyChange, reason } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          status: "error",
          message: "User not authenticated",
        });
      }

      // Manual stock adjustment using transaction
      await prisma.$transaction(async (tx) => {
        if (reason === "ADD" && qtyChange > 0) {
          await inventoryService.restoreInventory(
            storeId,
            [{ productId, qty: qtyChange }],
            userId,
            tx
          );
        } else if (reason === "REMOVE" && qtyChange > 0) {
          await inventoryService.reserveInventory(
            storeId,
            0, // orderId not needed for manual adjustment
            [{ productId, qty: qtyChange }],
            userId,
            tx
          );
        }
      });

      res.json({
        status: "success",
        message: "Stock updated successfully",
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  async getAllStores(req: Request, res: Response) {
    try {
      const stores = await prisma.store.findMany({
        select: {
          id: true,
          name: true,
          locations: {
            select: {
              addressLine: true,
              city: true,
              province: true,
            },
            take: 1,
          },
        },
        where: {
          isActive: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      // Flatten the response for easier frontend consumption
      const formattedStores = stores.map(store => ({
        id: store.id,
        name: store.name,
        address: store.locations[0]?.addressLine || '',
        city: store.locations[0]?.city || '',
        province: store.locations[0]?.province || '',
      }));

      res.json({
        status: "success",
        data: formattedStores,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  async getInventoryReport(req: Request, res: Response) {
    try {
      const { storeId, startDate, endDate } = req.query;

      const whereClause: any = {};
      if (storeId) whereClause.storeId = parseInt(storeId as string);
      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) whereClause.createdAt.gte = new Date(startDate as string);
        if (endDate) whereClause.createdAt.lte = new Date(endDate as string);
      }

      const [stockSummary, recentTransactions] = await Promise.all([
        // Stock summary by store
        prisma.storeInventory.groupBy({
          by: ['storeId'],
          _sum: {
            stockQty: true,
          },
          _count: {
            productId: true,
          },
          where: storeId ? { storeId: parseInt(storeId as string) } : undefined,
        }),

        // Recent stock transactions
        prisma.stockJournal.findMany({
          where: whereClause,
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
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        }),
      ]);

      res.json({
        status: "success",
        data: {
          stockSummary,
          recentTransactions,
        },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }
}

export const inventoryController = new InventoryController();
