import { prisma } from "@repo/database";
import { DiscountInput } from "../types/discount.js";

export const discountService = {
  async getAll() {
    return prisma.discount.findMany({
      include: { store: true, product: true },
    });
  },

  async getById(id: number) {
    return prisma.discount.findUnique({
      where: { id },
      include: { store: true, product: true },
    });
  },
  async createDiscount(data: DiscountInput) {
    const discount = await prisma.discount.create({
      data: {
        value: data.value,
        type: data.type,
        minPurchase: data.minPurchase ?? null,
        maxDiscount: data.maxDiscount ?? null,
        expiredAt: data.expiredAt,
        store: { connect: { id: data.storeId } },
        product: { connect: { id: data.productId } },
      },
      include: {
        store: true,
        product: true,
      },
    });

    return discount;
  },
  async updateDiscount(id: number, data: Partial<DiscountInput>) {
    const discount = await prisma.discount.update({
      where: { id },
      data: {
        value: data.value,
        type: data.type,
        minPurchase: data.minPurchase ?? undefined,
        maxDiscount: data.maxDiscount ?? undefined,
        expiredAt: data.expiredAt ?? undefined,
        store: data.storeId ? { connect: { id: data.storeId } } : undefined,
        product: data.productId
          ? { connect: { id: data.productId } }
          : undefined,
      },
      include: {
        store: true,
        product: true,
      },
    });

    return discount;
  },
  async deleteDiscount(id: number) {
    return prisma.discount.delete({
      where: { id },
    });
  },
};
