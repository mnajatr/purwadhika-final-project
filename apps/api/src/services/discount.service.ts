import { prisma } from "@repo/database";
import {
  CreateDiscount,
  UpdateDiscount,
  DiscountResponse,
  ValueType,
  DiscountType,
} from "../types/discount.js";

export const discountService = {
  async getAll(): Promise<DiscountResponse[]> {
    const discounts = await prisma.discount.findMany({
      include: { store: true, product: true },
    });

    return discounts.map((d) => ({
      id: d.id,
      name: d.name,
      value: d.value as ValueType, // konversi enum Prisma → enum lokal
      type: d.type as DiscountType,
      minPurchase: d.minPurchase ?? undefined,
      maxDiscount: d.maxDiscount ?? undefined,
      expiredAt: d.expiredAt.toISOString(), // Date → string
      store: { id: d.store.id, name: d.store.name },
      product: { id: d.product.id, name: d.product.name },
    }));
  },

  async getById(id: number): Promise<DiscountResponse | null> {
    const d = await prisma.discount.findUnique({
      where: { id },
      include: { store: true, product: true },
    });

    if (!d) return null;

    return {
      id: d.id,
      name: d.name,
      value: d.value as ValueType,
      type: d.type as DiscountType,
      minPurchase: d.minPurchase ?? undefined,
      maxDiscount: d.maxDiscount ?? undefined,
      expiredAt: d.expiredAt.toISOString(),
      store: { id: d.store.id, name: d.store.name },
      product: { id: d.product.id, name: d.product.name },
    };
  },

  async getByProductIds(productIds: number[]): Promise<DiscountResponse[]> {
    const discounts = await prisma.discount.findMany({
      where: {
        productId: { in: productIds },
      },
      include: { store: true, product: true },
    });

    return discounts.map((d) => ({
      id: d.id,
      name: d.name,
      value: d.value as ValueType,
      type: d.type as DiscountType,
      minPurchase: d.minPurchase ?? undefined,
      maxDiscount: d.maxDiscount ?? undefined,
      expiredAt: d.expiredAt.toISOString(),
      store: { id: d.store.id, name: d.store.name },
      product: { id: d.product.id, name: d.product.name },
    }));
  },

  async createDiscount(data: CreateDiscount): Promise<DiscountResponse> {
    const d = await prisma.discount.create({
      data: {
        name: data.name,
        value: data.value,
        type: data.type,
        minPurchase: data.minPurchase ?? null,
        maxDiscount: data.maxDiscount ?? null,
        expiredAt: new Date(data.expiredAt),
        store: { connect: { id: data.store.id } },
        product: { connect: { id: data.product.id } },
      },
      include: { store: true, product: true },
    });

    return {
      id: d.id,
      name: d.name,
      value: d.value as ValueType,
      type: d.type as DiscountType,
      minPurchase: d.minPurchase ?? undefined,
      maxDiscount: d.maxDiscount ?? undefined,
      expiredAt: d.expiredAt.toISOString(),
      store: { id: d.store.id, name: d.store.name },
      product: { id: d.product.id, name: d.product.name },
    };
  },

  async updateDiscount(
    id: number,
    data: UpdateDiscount
  ): Promise<DiscountResponse> {
    const d = await prisma.discount.update({
      where: { id },
      data: {
        name: data.name,
        value: data.value,
        type: data.type,
        minPurchase: data.minPurchase ?? undefined,
        maxDiscount: data.maxDiscount ?? undefined,
        expiredAt: data.expiredAt ? new Date(data.expiredAt) : undefined,
        store: data.store ? { connect: { id: data.store.id } } : undefined,
        product: data.product
          ? { connect: { id: data.product.id } }
          : undefined,
      },
      include: { store: true, product: true },
    });

    return {
      id: d.id,
      name: d.name,
      value: d.value as ValueType,
      type: d.type as DiscountType,
      minPurchase: d.minPurchase ?? undefined,
      maxDiscount: d.maxDiscount ?? undefined,
      expiredAt: d.expiredAt.toISOString(),
      store: { id: d.store.id, name: d.store.name },
      product: { id: d.product.id, name: d.product.name },
    };
  },

  async deleteDiscount(id: number): Promise<DiscountResponse> {
    const d = await prisma.discount.delete({
      where: { id },
      include: { store: true, product: true },
    });

    return {
      id: d.id,
      name: d.name,
      value: d.value as ValueType,
      type: d.type as DiscountType,
      minPurchase: d.minPurchase ?? undefined,
      maxDiscount: d.maxDiscount ?? undefined,
      expiredAt: d.expiredAt.toISOString(),
      store: { id: d.store.id, name: d.store.name },
      product: { id: d.product.id, name: d.product.name },
    };
  },
};
