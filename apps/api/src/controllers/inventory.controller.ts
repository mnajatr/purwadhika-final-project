import { Request, Response } from "express";
import { inventoryService } from "../services/inventory.service.js";
import { prisma } from "@repo/database";
import type {
  TransferBody,
  UpdateStockBody,
  StockJournalsQuery,
} from "@repo/schemas";

function parseNumber(v: unknown, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function sendSuccess(res: Response, data: any) {
  return res.json({ status: "success", data });
}

function sendMessage(res: Response, message: string) {
  return res.json({ status: "success", message });
}

function sendError(res: Response, error: unknown, status = 500) {
  return res.status(status).json({
    status: "error",
    message: error instanceof Error ? error.message : String(error),
  });
}

export class InventoryController {
  async getStoreInventories(req: Request, res: Response) {
    try {
      const { storeId } = req.params;
      const { page, limit, search } = req.query;

      const result = await inventoryService.getStoreInventories(
        parseNumber(storeId),
        parseNumber(page, 1),
        parseNumber(limit, 10),
        (search as string) || undefined
      );

      return sendSuccess(res, result);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async transferInventory(req: Request, res: Response) {
    try {
      const { fromStoreId, toStoreId, items, note } = req.body as TransferBody;
      const userId = req.user?.id;

      if (!userId) return sendError(res, "User not authenticated", 401);

      await inventoryService.transferInventory(
        fromStoreId,
        toStoreId,
        items,
        userId,
        note
      );
      return sendMessage(res, "Inventory transferred successfully");
    } catch (error) {
      return sendError(res, error);
    }
  }

  async getStockJournals(req: Request, res: Response) {
    try {
      const { storeId, page, limit, productId, reason, startDate, endDate } =
        req.query as unknown as StockJournalsQuery;

      const result = await inventoryService.getStockJournals(
        storeId ? parseNumber(storeId) : undefined,
        parseNumber(page, 1),
        parseNumber(limit, 10),
        productId ? parseNumber(productId) : undefined,
        reason,
        startDate,
        endDate
      );

      return sendSuccess(res, result);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async updateStockManual(req: Request, res: Response) {
    try {
      const { storeId, productId, qtyChange, reason } =
        req.body as UpdateStockBody;
      const userId = req.user?.id;
      if (!userId) return sendError(res, "User not authenticated", 401);

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
            0,
            [{ productId, qty: qtyChange }],
            userId,
            tx
          );
        }
      });

      return sendMessage(res, "Stock updated successfully");
    } catch (error) {
      return sendError(res, error);
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
          name: "asc",
        },
      });

      const formattedStores = stores.map((store) => ({
        id: store.id,
        name: store.name,
        address: store.locations[0]?.addressLine || "",
        city: store.locations[0]?.city || "",
        province: store.locations[0]?.province || "",
      }));

      res.json({
        status: "success",
        data: formattedStores,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  async getInventoryReport(req: Request, res: Response) {
    try {
      const { storeId, startDate, endDate } = req.query as Record<string, any>;

      const whereClause: any = {};
      if (storeId) whereClause.storeId = parseNumber(storeId);
      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate)
          whereClause.createdAt.gte = new Date(startDate as string);
        if (endDate) whereClause.createdAt.lte = new Date(endDate as string);
      }

      const [stockSummary, recentTransactions] = await Promise.all([
        // Stock summary by store
        prisma.storeInventory.groupBy({
          by: ["storeId"],
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
            createdAt: "desc",
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
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }
}

export const inventoryController = new InventoryController();
