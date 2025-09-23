import { Request, Response } from "express";
import { ProductService } from "../services/product.service.js";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import fs from "fs/promises";

const service = new ProductService();
const upload = multer({ dest: "uploads/" });

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class ProductController {
  static async getAll(req: Request, res: Response) {
    const { lat, lon, storeId } = req.query;

    if (storeId) {
      const sid = Number(storeId);
      if (!Number.isNaN(sid)) {
        const result = await service.getByStoreId(sid);
        return res.json(result);
      }
    }

    if (lat && lon) {
      const userLat = parseFloat(lat as string);
      const userLon = parseFloat(lon as string);

      if (!isNaN(userLat) && !isNaN(userLon)) {
        const result = await service.getByNearestStore(userLat, userLon);
        return res.json(result);
      }
    }

    const products = await service.getAllWithStock();
    res.json({
      products,
      nearestStore: null,
      message: "Showing all available products",
    });
  }

  static async getBySlug(req: Request, res: Response) {
    const { slug } = req.params;
    const product = await service.getBySlug(slug);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  }

  // CREATE PRODUCT + CLOUDINARY
  static create = [
    upload.array("images"),
    async (req: Request, res: Response) => {
      try {
        const files = req.files as Express.Multer.File[];
        let uploadedImages: { imageUrl: string }[] = [];

        if (files && files.length) {
          uploadedImages = await Promise.all(
            files.map(async (file) => {
              const result = await cloudinary.uploader.upload(file.path, {
                folder: "products",
              });
              // hapus file lokal setelah upload
              await fs.unlink(file.path);
              return { imageUrl: result.secure_url };
            })
          );
        }

        const productData = {
          ...req.body,
          images: uploadedImages.length ? uploadedImages : undefined,
        };

        const product = await service.createProduct(productData);
        res.status(201).json(product);
      } catch (e) {
        console.error("Create product error:", e);
        res.status(400).json({ message: "Failed to create product" });
      }
    },
  ];

  // UPDATE PRODUCT + CLOUDINARY
  static update = [
    upload.array("images"),
    async (req: Request, res: Response) => {
      try {
        const { slug } = req.params;
        const files = req.files as Express.Multer.File[];
        let uploadedImages: { imageUrl: string }[] = [];

        if (files && files.length) {
          uploadedImages = await Promise.all(
            files.map(async (file) => {
              const result = await cloudinary.uploader.upload(file.path, {
                folder: "products",
              });
              // hapus file lokal setelah upload
              await fs.unlink(file.path);
              return { imageUrl: result.secure_url };
            })
          );
        }

        const updatedData = {
          ...req.body,
          images: uploadedImages.length ? uploadedImages : req.body.images,
        };

        const updated = await service.updateProduct(slug, updatedData);

        if (!updated)
          return res.status(404).json({ message: "Product not found" });

        res.json(updated);
      } catch (e) {
        console.error("Update product error:", e);
        res.status(400).json({
          message: e instanceof Error ? e.message : "Failed to update product",
        });
      }
    },
  ];

  static async delete(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      const deleted = await service.deleteProduct(slug);
      if (!deleted)
        return res.status(404).json({ message: "Product not found" });
      res.json({ message: "Product deleted successfully" });
    } catch (e) {
      console.error("Delete product error:", e);
      res.status(400).json({
        message: e instanceof Error ? e.message : "Failed to delete product",
      });
    }
  }

  static async deactivate(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      const deactivated = await service.deactivateProduct(slug);
      if (!deactivated)
        return res.status(404).json({ message: "Product not found" });
      res.json({
        message: "Product deactivated successfully",
        product: deactivated,
      });
    } catch (e) {
      console.error("Deactivate product error:", e);
      res.status(400).json({
        message:
          e instanceof Error ? e.message : "Failed to deactivate product",
      });
    }
  }

  static async activate(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      const activated = await service.activateProduct(slug);
      if (!activated)
        return res.status(404).json({ message: "Product not found" });
      res.json({
        message: "Product activated successfully",
        product: activated,
      });
    } catch (e) {
      console.error("Activate product error:", e);
      res.status(400).json({
        message: e instanceof Error ? e.message : "Failed to activate product",
      });
    }
  }
}
