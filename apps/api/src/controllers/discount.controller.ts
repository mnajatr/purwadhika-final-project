import { Request, Response } from "express";
import { discountService } from "../services/discount.service.js";

export const discountController = {
  async getAll(req: Request, res: Response) {
    try {
      const discounts = await discountService.getAll();
      res.json(discounts);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const discount = await discountService.getById(id);
      if (!discount)
        return res.status(404).json({ message: "Discount not found" });
      res.json(discount);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const discount = await discountService.createDiscount(req.body);
      res.status(201).json(discount);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const discount = await discountService.updateDiscount(id, req.body);
      res.json(discount);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const discount = await discountService.deleteDiscount(id);
      res.json(discount);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  },
};
