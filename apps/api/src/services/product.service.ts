import { prisma } from "@repo/database";
import { locationService } from "./location.service.js";
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

    return products.map((p) => ({ ...p, price: Number(p.price) }));
  }

  async getAllWithStock() {
    const products = await prisma.product.findMany({
      where: { inventories: { some: { stockQty: { gt: 0 } } } },
      include: {
        category: true,
        inventories: {
          where: { stockQty: { gt: 0 } },
          select: {
            stockQty: true,
            store: { select: { id: true, name: true, locations: true } },
          },
        },
        images: true,
      },
    });

    return products.map((p) => ({ ...p, price: Number(p.price) }));
  }

  async getByNearestStore(lat: number, lon: number) {
    try {
      const nearestStoreId = await locationService.findNearestStoreId(lat, lon);
      if (!nearestStoreId)
        return {
          products: [],
          nearestStore: null,
          message: "No store found within service area",
        };

      const store = await prisma.store.findUnique({
        where: { id: nearestStoreId },
        select: { id: true, name: true, locations: true },
      });

      const products = await prisma.product.findMany({
        where: {
          inventories: {
            some: { storeId: nearestStoreId, stockQty: { gt: 0 } },
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

      return {
        products: products.map((p) => ({ ...p, price: Number(p.price) })),
        nearestStore: store,
        message: `Showing products from ${store?.name || "nearest store"}`,
      };
    } catch (error) {
      console.error("Error finding products by nearest store:", error);
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
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: { id: true, name: true, locations: true },
      });
      if (!store)
        return { products: [], nearestStore: null, message: "Store not found" };

      const products = await prisma.product.findMany({
        where: { inventories: { some: { storeId, stockQty: { gt: 0 } } } },
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

      return {
        products: products.map((p) => ({ ...p, price: Number(p.price) })),
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

  // ================= CREATE PRODUCT =================
  async createProduct(data: any) {
    // ===== Parse multipart/form-data =====
    if (typeof data.inventories === "string")
      data.inventories = JSON.parse(data.inventories);
    if (typeof data.categoryId === "string")
      data.categoryId = Number(data.categoryId);
    if (typeof data.price === "string") data.price = Number(data.price);

    if (data.inventories) {
      data.inventories = data.inventories.map((inv: any) => ({
        stockQty: Number(inv.stockQty),
        storeId: Number(inv.storeId),
      }));
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        price: data.price,
        weight: Number(data.weight),
        width: Number(data.width),
        height: Number(data.height),
        length: Number(data.length),
        category: { connect: { id: data.categoryId } },
        images: data.images
          ? {
              create: data.images.map((img: any) => ({
                imageUrl: img.imageUrl,
              })),
            }
          : undefined,
        inventories: data.inventories
          ? {
              create: data.inventories.map((inv: any) => ({
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

    return { ...product, price: Number(product.price) };
  }

  // ================= UPDATE PRODUCT =================
  async updateProduct(slug: string, data: any) {
    // Parse multipart/form-data
    if (typeof data.inventories === "string")
      data.inventories = JSON.parse(data.inventories);
    if (typeof data.categoryId === "string")
      data.categoryId = Number(data.categoryId);
    if (typeof data.price === "string") data.price = Number(data.price);

    if (data.inventories) {
      data.inventories = data.inventories.map((inv: any) => ({
        stockQty: Number(inv.stockQty),
        storeId: Number(inv.storeId),
      }));
    }

    const existingProduct = await prisma.product.findUnique({
      where: { slug },
      include: { inventories: true, images: true },
    });
    if (!existingProduct) throw new Error("Product not found");

    return prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { slug },
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          price: data.price,
          weight: Number(data.weight),
          width: Number(data.width),
          height: Number(data.height),
          length: Number(data.length),
          category: data.categoryId
            ? { connect: { id: data.categoryId } }
            : undefined,
        },
      });

      // ===== Images =====
      if (data.images) {
        await tx.productImage.deleteMany({ where: { productId: product.id } });
        await tx.productImage.createMany({
          data: data.images.map((img: any) => ({
            productId: product.id,
            imageUrl: img.imageUrl,
          })),
        });
      }

      // ===== Inventories =====
      if (data.inventories) {
        for (const invData of data.inventories) {
          const existingInventory = await tx.storeInventory.findUnique({
            where: {
              storeId_productId: {
                storeId: invData.storeId,
                productId: product.id,
              },
            },
          });

          if (existingInventory) {
            await tx.storeInventory.update({
              where: {
                storeId_productId: {
                  storeId: invData.storeId,
                  productId: product.id,
                },
              },
              data: { stockQty: invData.stockQty },
            });
          } else {
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

      const updatedProduct = await tx.product.findUnique({
        where: { id: product.id },
        include: {
          category: true,
          inventories: { include: { store: true } },
          images: true,
        },
      });

      return { ...updatedProduct!, price: Number(updatedProduct!.price) };
    });
  }

  // ================= DELETE PRODUCT =================
  async deleteProduct(slug: string) {
    const product = await prisma.product.findUnique({ where: { slug } });
    if (!product) return null;

    const orderItems = await prisma.orderItem.findFirst({
      where: { productId: product.id },
    });
    if (orderItems)
      throw new Error(
        "Cannot delete product that has been ordered. Deactivate instead."
      );

    return prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({ where: { productId: product.id } });
      await tx.stockJournal.deleteMany({ where: { productId: product.id } });
      await tx.voucher.deleteMany({
        where: { discount: { productId: product.id } },
      });
      await tx.discount.deleteMany({ where: { productId: product.id } });
      await tx.storeInventory.deleteMany({ where: { productId: product.id } });
      await tx.productImage.deleteMany({ where: { productId: product.id } });
      return tx.product.delete({ where: { slug } });
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
    return { ...product, price: Number(product.price) };
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
    return { ...product, price: Number(product.price) };
  }
}
