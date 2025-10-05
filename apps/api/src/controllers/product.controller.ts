import { Request, Response } from "express";
import { ProductService } from "../services/product.service.js";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import fs from "fs/promises";
import { productForCreateSchema } from "packages/schemas/dist/product.schema.js";

const service = new ProductService();
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 1 * 1024 * 1024, // 1 MB
  },
  fileFilter: (req, file, cb) => {
    // validasi ekstensi file
    const allowedTypes = /jpeg|jpg|png|gif/;
    const mimeType = allowedTypes.test(file.mimetype);
    const extName = allowedTypes.test(
      file.originalname.toLowerCase().split(".").pop() || ""
    );

    if (mimeType && extName) {
      cb(null, true);
    } else {
      cb(new Error("Only .jpg, .jpeg, .png, and .gif formats are allowed!"));
    }
  },
});

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class ProductController {
  static async getAll(req: Request, res: Response) {
    const { lat, lon, storeId, page = "0", limit = "12" } = req.query;

    const pageNumber = parseInt(page as string) || 0;
    const limitNumber = parseInt(limit as string) || 12;

    if (storeId) {
      const sid = Number(storeId);
      if (!Number.isNaN(sid)) {
        const result = await service.getByStoreId(sid, pageNumber, limitNumber);
        return res.json(result);
      }
    }

    if (lat && lon) {
      const userLat = parseFloat(lat as string);
      const userLon = parseFloat(lon as string);

      if (!isNaN(userLat) && !isNaN(userLon)) {
        const result = await service.getByNearestStore(
          userLat,
          userLon,
          pageNumber,
          limitNumber
        );
        return res.json(result);
      }
    }

    const result = await service.getAllWithStock(pageNumber, limitNumber);
    res.json({
      ...result,
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
        const { name } = req.body;
        const existing = await service.getByName(name);

        let inventories = [];
        if (req.body.inventories) {
          try {
            inventories =
              typeof req.body.inventories === "string"
                ? JSON.parse(req.body.inventories)
                : req.body.inventories;
          } catch {
            inventories = [];
          }
        }

        const parsed = productForCreateSchema.parse({
          ...req.body,
          images: req.body.images,
          inventories,
        });

        if (existing) {
          return res
            .status(400)
            .json({ message: "Product name already exists" });
        }
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

        // parse inventories jika masih string
        const inventories =
          typeof req.body.inventories === "string"
            ? JSON.parse(req.body.inventories)
            : req.body.inventories;

        // parse seluruh input pakai Zod
        const parsed = productForCreateSchema.parse({
          ...req.body,
          images: req.body.images,
          inventories,
        });

        // upload images jika ada
        if (files && files.length) {
          uploadedImages = await Promise.all(
            files.map(async (file) => {
              const result = await cloudinary.uploader.upload(file.path, {
                folder: "products",
              });
              await fs.unlink(file.path);
              return { imageUrl: result.secure_url };
            })
          );
        }

        const updatedData = {
          ...parsed,
          images: uploadedImages.length ? uploadedImages : parsed.images,
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
