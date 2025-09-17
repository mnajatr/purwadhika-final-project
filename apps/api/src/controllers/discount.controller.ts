import { Request, Response } from "express";
import { discountService } from "../services/discount.service.js";

export const discountController = {
  async getAll(req: Request, res: Response) {
    const discounts = await discountService.getAll();
    res.json(discounts);
  },

  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const discount = await discountService.getById(Number(id));
    if (!discount)
      return res.status(404).json({ message: "Discount not found" });
    res.json(discount);
  },
  async create(req: Request, res: Response) {
    try {
      const {
        storeId,
        productId,
        value,
        type,
        minPurchase,
        maxDiscount,
        expiredAt,
      } = req.body;

      if (!storeId || !productId || !value || !type || !expiredAt) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const discount = await discountService.createDiscount({
        storeId: Number(storeId),
        productId: Number(productId),
        value,
        type,
        minPurchase: minPurchase ? Number(minPurchase) : undefined,
        maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
        expiredAt: new Date(expiredAt),
      });

      res.status(201).json(discount);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        storeId,
        productId,
        value,
        type,
        minPurchase,
        maxDiscount,
        expiredAt,
      } = req.body;

      const updated = await discountService.updateDiscount(Number(id), {
        storeId: storeId ? Number(storeId) : undefined,
        productId: productId ? Number(productId) : undefined,
        value,
        type,
        minPurchase: minPurchase ? Number(minPurchase) : undefined,
        maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
        expiredAt: expiredAt ? new Date(expiredAt) : undefined,
      });

      res.json(updated);
    } catch (error: any) {
      if (error.code === "P2025") {
        // Prisma error kalau data tidak ditemukan
        return res.status(404).json({ message: "Discount not found" });
      }
      res.status(500).json({ message: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await discountService.deleteDiscount(Number(id));
      res.json({ message: "Discount deleted successfully" });
    } catch (error: any) {
      if (error.code === "P2025") {
        return res.status(404).json({ message: "Discount not found" });
      }
      res.status(500).json({ message: error.message });
    }
  },
};
