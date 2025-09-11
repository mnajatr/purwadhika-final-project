import { prisma } from "@repo/database";
import { Prisma } from "@prisma/client";
import { CreateProduct } from "../types/product.js";

export class ProductService {
  async getAll() {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        inventories: {
          select: {
            stockQty: true,
            store: { select: { id: true, name: true, locations: true } },
          },
        },
        images: true,
      },
    });

    return products.map((p) => ({
      ...p,
      price: Number(p.price), // <- langsung ubah string ke number
    }));
  }

  async getBySlug(slug: string) {
    return prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        inventories: { include: { store: true } },
        images: true,
      },
    });
  }
  async createProduct(data: CreateProduct) {
    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        price: data.price,
        weight: data.weight,
        width: data.width,
        height: data.height,
        length: data.length,
        category: { connect: { id: data.categoryId } },
        images: data.images
          ? {
              create: data.images.map((img) => ({
                imageUrl: img.imageUrl,
              })),
            }
          : undefined,
        inventories: data.inventories
          ? {
              create: data.inventories.map((inv) => ({
                stockQty: inv.stockQty,
                store: { connect: { id: inv.storeId } },
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        inventories: { include: { store: true } },
        images: true,
      },
    });

    return {
      ...product,
      price: Number(product.price),
    };
  }
}
