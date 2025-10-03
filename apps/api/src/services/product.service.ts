import { prisma } from "@repo/database";
import { locationService } from "./location.service.js";
import { CreateProduct } from "../types/product.js";

export class ProductService {
  async getAll(page: number = 0, limit: number = 10) {
    if (page < 0) {
      throw new Error("Page must be >= 0");
    }

    const skip = page === 0 ? 0 : (page - 1) * limit;
    const products = await prisma.product.findMany({
      skip,
      take: limit,
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
    const productsz = await prisma.product.findMany({
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
    const realproduct = page === 0 ? productsz : products;
    const total = await prisma.product.count();

    return {
      data: realproduct.map((p) => ({ ...p, price: Number(p.price) })),
      total,
      page,
      limit,
    };
  }

  async getAllWithStock(page: number = 1, limit: number = 10) {
    if (page < 0) {
      throw new Error("Page must be >= 0");
    }
    const skip = Math.max(0, (page - 1) * limit);
    // Hanya produk yang punya stock > 0
    const products = await prisma.product.findMany({
      where: { inventories: { some: { stockQty: { gt: 0 } } } },
      skip,
      take: limit,
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
    const total = await prisma.product.count({
      where: { inventories: { some: { stockQty: { gt: 0 } } } },
    });

    return {
      data: products.map((p) => ({ ...p, price: Number(p.price) })),
      total,
      page,
      limit,
    };
  }

  // ================= GET BY NEAREST STORE =================
  async getByNearestStore(
    lat: number,
    lon: number,
    page: number = 1,
    limit: number = 10
  ) {
    try {
      const nearestStoreId = await locationService.findNearestStoreId(lat, lon);
      if (!nearestStoreId)
        return {
          products: [],
          nearestStore: null,
          page,
          limit,
          total: 0,
          message: "No store found within service area",
        };

      const store = await prisma.store.findUnique({
        where: { id: nearestStoreId },
        select: { id: true, name: true, locations: true },
      });

      const skip = (page - 1) * limit;

      const products = await prisma.product.findMany({
        skip,
        take: limit,
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
      const total = await prisma.product.count({
        where: { inventories: { some: { storeId: nearestStoreId } } },
      });

      return {
        products: products.map((p) => ({ ...p, price: Number(p.price) })),
        nearestStore: store,
        total,
        page,
        limit,
        message: `Showing products from ${store?.name || "nearest store"}`,
      };
    } catch (error) {
      console.error("Error finding products by nearest store:", error);
      const products = await this.getAll(page, limit);
      return {
        products,
        page,
        limit,
        nearestStore: null,
        message: "Showing all products (location service unavailable)",
      };
    }
  }

  // ================= GET BY STORE ID =================
  async getByStoreId(storeId: number, page: number = 0, limit: number = 10) {
    if (page < 0) {
      throw new Error("Page must be >= 0");
    }

    try {
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: { id: true, name: true, locations: true },
      });
      if (!store)
        return {
          data: [],
          total: 0,
          page,
          limit,
          nearestStore: null,
          message: "Store not found",
        };

      const skip = page === 0 ? 0 : (page - 1) * limit;

      const products = await prisma.product.findMany({
        where: { inventories: { some: { storeId } } },
        skip,
        take: page === 0 ? undefined : limit,
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

      const total = await prisma.product.count({
        where: { inventories: { some: { storeId } } },
      });

      return {
        data: products.map((p) => ({ ...p, price: Number(p.price) })),
        nearestStore: store,
        total,
        page,
        limit,
        message: `Showing products from ${store?.name || "selected store"}`,
      };
    } catch (error) {
      console.error("Error finding products by storeId:", error);
      const products = await this.getAll();
      return {
        products,
        nearestStore: null,
        message: "Showing all products (store lookup failed)",
      };
    }
  }

  // ================= GET BY SLUG =================
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
    if (typeof data.inventories === "string")
      data.inventories = JSON.parse(data.inventories);
    if (typeof data.categoryId === "string")
      data.categoryId = Number(data.categoryId);
    if (typeof data.price === "string") data.price = Number(data.price);

    if (data.inventories) {
      data.inventories = data.inventories.map((inv: any) => ({
        stockQty: 0,
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
    if (typeof data.inventories === "string")
      data.inventories = JSON.parse(data.inventories);
    if (typeof data.categoryId === "string")
      data.categoryId = Number(data.categoryId);
    if (typeof data.price === "string") data.price = Number(data.price);

    if (data.inventories) {
      data.inventories = data.inventories.map((inv: any) => ({
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

      // Update images
      if (data.images) {
        await tx.productImage.deleteMany({ where: { productId: product.id } });
        await tx.productImage.createMany({
          data: data.images.map((img: any) => ({
            productId: product.id,
            imageUrl: img.imageUrl,
          })),
        });
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

  // ================= DEACTIVATE / ACTIVATE =================
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
  async getByName(name: string) {
    return prisma.product.findUnique({ where: { name } });
  }
}
