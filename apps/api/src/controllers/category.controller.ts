import { Request, Response } from "express";
import { CategoryService } from "../services/category.service.js";

const service = new CategoryService();

export class CategoryController {
  // ================= GET ALL =================
  static async getAll(req: Request, res: Response) {
    try {
      const { page, limit } = req.query;

      if (page || limit) {
        const pageNumber = parseInt(page as string) || 0;
        const limitNumber = parseInt(limit as string) || 10;
        const result = await service.getAllPaginated(pageNumber, limitNumber);
        return res.json(result);
      }

      const categories = await service.getAll();
      res.json({
        data: categories,
        total: categories.length,
        page: 1,
        limit: categories.length,
      });
    } catch (err: any) {
      console.error("Get all categories error:", err);
      res.status(500).json({ message: err.message });
    }
  }

  // ================= GET BY ID =================
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const category = await service.getById(Number(id));
      res.json(category);
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  }

  // ================= CREATE =================
  static async create(req: Request, res: Response) {
    try {
      const { name, description } = req.body;
      if (!name) return res.status(400).json({ message: "Name is required" });

      const category = await service.create(name, description);
      res.status(201).json(category);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  // ================= UPDATE =================
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      if (!name) return res.status(400).json({ message: "Name is required" });

      const category = await service.update(Number(id), name, description);
      res.json(category);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  // ================= DELETE =================
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await service.delete(Number(id));
      res.json({ message: "Category deleted successfully" });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
}
