import { prisma } from "@repo/database";
import { Prisma } from "@prisma/client";
import { CreateProduct } from "../types/product.js";
import { locationService } from "./location.service.js";

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

  async getAllWithStock() {
    const products = await prisma.product.findMany({
      where: {
        inventories: {
          some: {
            stockQty: { gt: 0 } // Only products with stock > 0
          }
        }
      },
      include: {
        category: true,
        inventories: {
          where: {
            stockQty: { gt: 0 } // Only show inventories with stock
          },
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
      price: Number(p.price),
    }));
  }

  async getByNearestStore(lat: number, lon: number) {
    try {
      // Find the nearest store using existing location service
      const nearestStoreId = await locationService.findNearestStoreId(lat, lon);
      
      if (!nearestStoreId) {
        // Return empty result with message if no nearby store found
        return {
          products: [],
          nearestStore: null,
          message: "No store found within service area"
        };
      }

      // Get store details
      const store = await prisma.store.findUnique({
        where: { id: nearestStoreId },
        select: { id: true, name: true, locations: true }
      });

      // Get products available at this store
      const products = await prisma.product.findMany({
        where: {
          inventories: {
            some: {
              storeId: nearestStoreId,
              stockQty: { gt: 0 } // Only products with stock
            }
          }
        },
        include: {
          category: true,
          inventories: {
            where: { storeId: nearestStoreId },
            select: {
              stockQty: true,
              store: { select: { id: true, name: true, locations: true } },
            },
          },
          images: true,
        },
      });

      const formattedProducts = products.map((p) => ({
        ...p,
        price: Number(p.price),
      }));

      return {
        products: formattedProducts,
        nearestStore: store,
        message: `Showing products from ${store?.name || 'nearest store'}`
      };
    } catch (error) {
      console.error('Error finding products by nearest store:', error);
      // Fallback to all products with stock when location service fails
      const products = await this.getAllWithStock();
      return {
        products,
        nearestStore: null,
        message: "Showing all available products (location service unavailable)"
      };
    }
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

  async updateProduct(slug: string, data: Partial<CreateProduct>) {
    const product = await prisma.product.update({
      where: { slug },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        price: data.price,
        weight: data.weight,
        width: data.width,
        height: data.height,
        length: data.length,
        category: data.categoryId
          ? { connect: { id: data.categoryId } }
          : undefined,

        images: data.images
          ? {
              deleteMany: {},
              create: data.images.map((img) => ({
                imageUrl: img.imageUrl,
              })),
            }
          : undefined,

        inventories: data.inventories
          ? {
              deleteMany: {},
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

  async deleteProduct(slug: string) {
    const product = await prisma.product.findUnique({ where: { slug } });
    if (!product) return null;

    await prisma.storeInventory.deleteMany({
      where: { productId: product.id },
    });
    await prisma.productImage.deleteMany({ where: { productId: product.id } });

    return prisma.product.delete({
      where: { slug },
    });
  }
}
