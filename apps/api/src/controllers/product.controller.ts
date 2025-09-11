import { Request, Response } from "express";
import { ProductService } from "../services/product.service.js";

const service = new ProductService();

export class ProductController {
  static async getAll(req: Request, res: Response) {
    const products = await service.getAll();
    res.json(products);
  }

  static async getBySlug(req: Request, res: Response) {
    const { slug } = req.params;
    const product = await service.getBySlug(slug);

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json(product);
  }

  static async create(req: Request, res: Response) {
    try {
      const product = await service.createProduct(req.body);
      res.status(201).json(product);
    } catch (e) {
      res.status(400).json({ message: "Failed to create product" });
    }
  }
}
