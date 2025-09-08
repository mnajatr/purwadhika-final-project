import { prisma } from "@repo/database";
import { Prisma } from "@prisma/client";

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
}
