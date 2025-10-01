import { Request, Response } from "express";
import { DiscountService } from "../services/discount.service.js";

const service = new DiscountService();

export class DiscountController {
  // GET ALL DISCOUNTS / PAGINATED
  static async getAll(req: Request, res: Response) {
    try {
      const { page = "1", limit = "10" } = req.query;
      const pageNumber = parseInt(page as string) || 1;
      const limitNumber = parseInt(limit as string) || 10;

      const result = await service.getAllPaginated(pageNumber, limitNumber);
      res.json(result);
    } catch (err: any) {
      console.error("Get all discounts error:", err);
      res.status(500).json({ message: err.message });
    }
  }

  // GET DISCOUNT BY ID
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const discount = await service.getById(Number(id));
      if (!discount)
        return res.status(404).json({ message: "Discount not found" });
      res.json(discount);
    } catch (err: any) {
      console.error("Get discount by ID error:", err);
      res.status(500).json({ message: err.message });
    }
  }

  static async getDiscountsByProductIds(req: Request, res: Response) {
    try {
      const { productIds } = req.body;

      if (!Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({
          message: "productIds harus berupa array dan tidak boleh kosong",
        });
      }

      const discounts = await service.getByProductIds(productIds);
      return res.json(discounts);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // CREATE DISCOUNT
  static async create(req: Request, res: Response) {
    try {
      const discount = await service.create(req.body);
      res.status(201).json(discount);
    } catch (err: any) {
      console.error("Create discount error:", err);
      res.status(400).json({ message: err.message });
    }
  }

  // UPDATE DISCOUNT
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updated = await service.update(Number(id), req.body);
      res.json(updated);
    } catch (err: any) {
      console.error("Update discount error:", err);
      res.status(400).json({ message: err.message });
    }
  }

  // DELETE DISCOUNT
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await service.delete(Number(id));
      res.json({ message: "Discount deleted successfully", discount: deleted });
    } catch (err: any) {
      console.error("Delete discount error:", err);
      res.status(400).json({ message: err.message });
    }
  }
}
