import { Request, Response } from "express";
import { ProductService } from "../services/product.service.js";

const service = new ProductService();

export class ProductController {
  static async getAll(req: Request, res: Response) {
    const { lat, lon } = req.query;
    
    if (lat && lon) {
      const userLat = parseFloat(lat as string);
      const userLon = parseFloat(lon as string);
      
      if (!isNaN(userLat) && !isNaN(userLon)) {
        const result = await service.getByNearestStore(userLat, userLon);
        return res.json(result);
      }
    }

    // When no coordinates provided, show only products with stock
    const products = await service.getAllWithStock();
    const response = {
      products,
      nearestStore: null,
      message: "Showing all available products"
    };
    res.json(response);
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
  static async update(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      const updated = await service.updateProduct(slug, req.body);

      if (!updated) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(updated);
    } catch (e) {
      res.status(400).json({ message: "Failed to update product" });
    }
  }
  static async delete(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      const deleted = await service.deleteProduct(slug);

      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({ message: "Product deleted successfully" });
    } catch (e) {
      res.status(400).json({ message: "Failed to delete product" });
    }
  }
}
