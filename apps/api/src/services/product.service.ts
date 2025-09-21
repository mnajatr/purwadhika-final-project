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
            stockQty: { gt: 0 }, // Only products with stock > 0
          },
        },
      },
      include: {
        category: true,
        inventories: {
          where: {
            stockQty: { gt: 0 }, // Only show inventories with stock
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
          message: "No store found within service area",
        };
      }

      // Get store details
      const store = await prisma.store.findUnique({
        where: { id: nearestStoreId },
        select: { id: true, name: true, locations: true },
      });

      // Get products available at this store
      const products = await prisma.product.findMany({
        where: {
          inventories: {
            some: {
              storeId: nearestStoreId,
              stockQty: { gt: 0 }, // Only products with stock
            },
          },
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
        message: `Showing products from ${store?.name || "nearest store"}`,
      };
    } catch (error) {
      console.error("Error finding products by nearest store:", error);
      // Fallback to all products with stock when location service fails
      const products = await this.getAllWithStock();
      return {
        products,
        nearestStore: null,
        message:
          "Showing all available products (location service unavailable)",
      };
    }
  }

  async getByStoreId(storeId: number) {
    try {
      // Get store details
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: { id: true, name: true, locations: true },
      });

      if (!store) {
        return {
          products: [],
          nearestStore: null,
          message: "Store not found",
        };
      }

      // Get products available at this store
      const products = await prisma.product.findMany({
        where: {
          inventories: {
            some: {
              storeId: storeId,
              stockQty: { gt: 0 },
            },
          },
        },
        include: {
          category: true,
          inventories: {
            where: { storeId },
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
        message: `Showing products from ${store?.name || "selected store"}`,
      };
    } catch (error) {
      console.error("Error finding products by storeId:", error);
      const products = await this.getAllWithStock();
      return {
        products,
        nearestStore: null,
        message: "Showing all available products (store lookup failed)",
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
    // First, get the existing product
    const existingProduct = await prisma.product.findUnique({
      where: { slug },
      include: { inventories: true, images: true },
    });

    if (!existingProduct) {
      throw new Error("Product not found");
    }

    // Use a transaction to ensure data consistency
    return await prisma.$transaction(async (tx) => {
      // Update basic product information
      const product = await tx.product.update({
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
        },
      });

      // Handle images separately
      if (data.images) {
        // Delete existing images
        await tx.productImage.deleteMany({
          where: { productId: product.id },
        });

        // Create new images
        await tx.productImage.createMany({
          data: data.images.map((img) => ({
            productId: product.id,
            imageUrl: img.imageUrl,
          })),
        });
      }

      // Handle inventories more carefully
      if (data.inventories) {
        // For inventories, we'll update existing ones or create new ones
        // but we won't delete existing ones that have stock journals
        for (const invData of data.inventories) {
          // Check if inventory already exists for this store
          const existingInventory = await tx.storeInventory.findUnique({
            where: {
              storeId_productId: {
                storeId: invData.storeId,
                productId: product.id,
              },
            },
          });

          if (existingInventory) {
            // Update existing inventory
            await tx.storeInventory.update({
              where: {
                storeId_productId: {
                  storeId: invData.storeId,
                  productId: product.id,
                },
              },
              data: {
                stockQty: invData.stockQty,
              },
            });
          } else {
            // Create new inventory
            await tx.storeInventory.create({
              data: {
                storeId: invData.storeId,
                productId: product.id,
                stockQty: invData.stockQty,
              },
            });
          }
        }
      }

      // Return the updated product with relationships
      const updatedProduct = await tx.product.findUnique({
        where: { id: product.id },
        include: {
          category: true,
          inventories: { include: { store: true } },
          images: true,
        },
      });

      return {
        ...updatedProduct!,
        price: Number(updatedProduct!.price),
      };
    });
  }

  async deleteProduct(slug: string) {
    const product = await prisma.product.findUnique({ where: { slug } });
    if (!product) return null;

    // Check if product has any order items (cannot delete if ordered)
    const orderItems = await prisma.orderItem.findFirst({
      where: { productId: product.id },
    });

    if (orderItems) {
      throw new Error(
        "Cannot delete product that has been ordered. You can deactivate it instead."
      );
    }

    // Use transaction to ensure all deletes succeed or fail together
    return await prisma.$transaction(async (tx) => {
      // Delete related records in the correct order
      await tx.cartItem.deleteMany({
        where: { productId: product.id },
      });

      await tx.stockJournal.deleteMany({
        where: { productId: product.id },
      });

      // Delete vouchers first, then discounts
      await tx.voucher.deleteMany({
        where: {
          discount: {
            productId: product.id,
          },
        },
      });

      await tx.discount.deleteMany({
        where: { productId: product.id },
      });

      await tx.storeInventory.deleteMany({
        where: { productId: product.id },
      });

      await tx.productImage.deleteMany({
        where: { productId: product.id },
      });

      return tx.product.delete({
        where: { slug },
      });
    });
  }

  async deactivateProduct(slug: string) {
    const product = await prisma.product.update({
      where: { slug },
      data: { isActive: false },
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

  async activateProduct(slug: string) {
    const product = await prisma.product.update({
      where: { slug },
      data: { isActive: true },
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
