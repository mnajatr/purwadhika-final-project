import apiClient from "@/lib/axios-client";
import { DiscountResponse } from "../types/discount.types";

class DiscountsService {
  private readonly basePath = "/discounts";

  async getDiscounts() {
    const discounts = await apiClient.get<DiscountResponse[]>(this.basePath);

    return discounts.map((discount) => ({
      id: discount.id,
      storeId: discount.storeId,
      productId: discount.productId,
      value: discount.value,
      type: discount.type,
      minPurchase: discount.minPurchase ?? null,
      maxDiscount: discount.maxDiscount ?? null,
      expiredAt: new Date(discount.expiredAt),
      store: discount.store,
      product: discount.product,
    }));
  }

  async getDiscountById(id: number) {
    const discount = await apiClient.get<DiscountResponse>(
      `${this.basePath}/${id}`
    );

    return {
      id: discount.id,
      storeId: discount.storeId,
      productId: discount.productId,
      value: discount.value,
      type: discount.type,
      minPurchase: discount.minPurchase ?? null,
      maxDiscount: discount.maxDiscount ?? null,
      expiredAt: new Date(discount.expiredAt),
      store: discount.store,
      product: discount.product,
    };
  }

  async createDiscount(data: DiscountResponse) {
    const discount = await apiClient.post<DiscountResponse>(
      this.basePath,
      data
    );

    return {
      id: discount.id,
      storeId: discount.storeId,
      productId: discount.productId,
      value: discount.value,
      type: discount.type,
      minPurchase: discount.minPurchase ?? null,
      maxDiscount: discount.maxDiscount ?? null,
      expiredAt: new Date(discount.expiredAt),
      store: discount.store,
      product: discount.product,
    };
  }

  async updateDiscount(id: number, data: Partial<DiscountResponse>) {
    const discount = await apiClient.put<DiscountResponse>(
      `${this.basePath}/${id}`,
      data
    );

    return {
      id: discount.id,
      storeId: discount.storeId,
      productId: discount.productId,
      value: discount.value,
      type: discount.type,
      minPurchase: discount.minPurchase ?? null,
      maxDiscount: discount.maxDiscount ?? null,
      expiredAt: new Date(discount.expiredAt),
      store: discount.store,
      product: discount.product,
    };
  }

  async deleteDiscount(id: number) {
    await apiClient.delete(`${this.basePath}/${id}`);
    return { message: "Discount deleted successfully" };
  }
}

export const discountsService = new DiscountsService();
export const getDiscounts = () => discountsService.getDiscounts();
export const getDiscountById = (id: number) =>
  discountsService.getDiscountById(id);
export const createDiscount = (data: DiscountResponse) =>
  discountsService.createDiscount(data);
export const updateDiscount = (id: number, data: Partial<DiscountResponse>) =>
  discountsService.updateDiscount(id, data);
export const deleteDiscount = (id: number) =>
  discountsService.deleteDiscount(id);
