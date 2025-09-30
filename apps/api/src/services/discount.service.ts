import { prisma } from "@repo/database";
import {
  CreateDiscount,
  UpdateDiscount,
  DiscountResponse,
  ValueType,
  DiscountType,
} from "../types/discount.js";

export class DiscountService {
  // ================= GET ALL DISCOUNTS =================
  async getAll(): Promise<DiscountResponse[]> {
    const discounts = await prisma.discount.findMany({
      include: { store: true, product: true },
    });
    return this.formatDiscounts(discounts);
  }

  // ================= GET ALL WITH PAGINATION =================
  async getAllPaginated(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [discounts, total] = await Promise.all([
      prisma.discount.findMany({
        skip,
        take: limit,
        include: { store: true, product: true },
      }),
      prisma.discount.count(),
    ]);

    return {
      data: this.formatDiscounts(discounts),
      total,
      page,
      limit,
    };
  }

  // ================= GET BY ID =================
  async getById(id: number): Promise<DiscountResponse | null> {
    const d = await prisma.discount.findUnique({
      where: { id },
      include: { store: true, product: true },
    });
    if (!d) return null;
    return this.formatDiscount(d);
  }

  // ================= GET BY PRODUCT IDS =================
  async getByProductIds(productIds: number[]): Promise<DiscountResponse[]> {
    const discounts = await prisma.discount.findMany({
      where: { productId: { in: productIds } },
      include: { store: true, product: true },
    });
    return this.formatDiscounts(discounts);
  }

  // ================= CREATE DISCOUNT =================
  async create(data: CreateDiscount): Promise<DiscountResponse> {
    const d = await prisma.discount.create({
      data: {
        name: data.name,
        value: data.value,
        type: data.type,
        amount: data.amount ?? null,
        minPurchase: data.minPurchase ?? null,
        maxDiscount: data.maxDiscount ?? null,
        buyQty: data.type === "BUYXGETX" ? data.buyQty : null,
        getQty: data.type === "BUYXGETX" ? data.getQty : null,
        expiredAt: new Date(data.expiredAt),
        store: { connect: { id: data.store.id } },
        product: { connect: { id: data.product.id } },
      },
      include: { store: true, product: true },
    });

    return this.formatDiscount(d);
  }

  // ================= UPDATE DISCOUNT =================
  async update(id: number, data: UpdateDiscount): Promise<DiscountResponse> {
    const d = await prisma.discount.update({
      where: { id },
      data: {
        name: data.name,
        value: data.value,
        type: data.type,
        amount: data.type === "NOMINAL" ? data.amount : null,
        minPurchase: data.minPurchase ?? undefined,
        maxDiscount: data.maxDiscount ?? undefined,
        buyQty: data.type === "BUYXGETX" ? data.buyQty : null,
        getQty: data.type === "BUYXGETX" ? data.getQty : null,
        expiredAt: data.expiredAt ? new Date(data.expiredAt) : undefined,
        store: data.store
          ? { connect: { id: Number(data.store.id) } }
          : undefined,
        product: data.product
          ? { connect: { id: Number(data.product.id) } }
          : undefined,
      },
      include: { store: true, product: true },
    });

    return this.formatDiscount(d);
  }

  // ================= DELETE DISCOUNT =================
  async delete(id: number): Promise<DiscountResponse> {
    const d = await prisma.discount.delete({
      where: { id },
      include: { store: true, product: true },
    });

    return this.formatDiscount(d);
  }

  // ================= PRIVATE HELPER =================
  private formatDiscount(d: any): DiscountResponse {
    return {
      id: d.id,
      name: d.name,
      value: d.value as ValueType,
      type: d.type as DiscountType,
      amount: d.amount ?? undefined,
      minPurchase: d.minPurchase ?? undefined,
      maxDiscount: d.maxDiscount ?? undefined,
      buyQty: d.buyQty ?? undefined,
      getQty: d.getQty ?? undefined,
      expiredAt: d.expiredAt.toISOString(),
      store: { id: d.store.id, name: d.store.name },
      product: { id: d.product.id, name: d.product.name },
    };
  }

  private formatDiscounts(discounts: any[]): DiscountResponse[] {
    return discounts.map((d) => this.formatDiscount(d));
  }
}
