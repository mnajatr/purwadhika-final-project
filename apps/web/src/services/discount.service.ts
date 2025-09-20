import apiClient from "@/lib/axios-client";
import {
  DiscountResponse,
  CreateDiscount,
  UpdateDiscount,
} from "@/types/discount.types";

class DiscountsService {
  private readonly basePath = "/discounts";

  async getDiscounts() {
    const response = await apiClient.get<DiscountResponse[]>(this.basePath);

    return response.map((discount) => ({
      id: discount.id,
      name: discount.name,
      type: discount.type,
      value: discount.value,
      expiredAt: discount.expiredAt ? new Date(discount.expiredAt) : null,
      store: discount.store
        ? { id: discount.store.id, name: discount.store.name }
        : null,
      product: discount.product
        ? { id: discount.product.id, name: discount.product.name }
        : null,
    }));
  }

  async getDiscountById(id: number) {
    const discount = await apiClient.get<DiscountResponse>(
      `${this.basePath}/${id}`
    );

    return {
      id: discount.id,
      name: discount.name,
      type: discount.type,
      value: discount.value,
      expiredAt: discount.expiredAt ? new Date(discount.expiredAt) : null,
      store: discount.store
        ? { id: discount.store.id, name: discount.store.name }
        : null,
      product: discount.product
        ? { id: discount.product.id, name: discount.product.name }
        : null,
    };
  }

  async createDiscount(data: CreateDiscount) {
    const discount = await apiClient.post<DiscountResponse>(
      this.basePath,
      data
    );

    return {
      id: discount.id,
      name: discount.name,
      type: discount.type,
      value: discount.value,
      expiredAt: discount.expiredAt ? new Date(discount.expiredAt) : null,
      store: discount.store
        ? { id: discount.store.id, name: discount.store.name }
        : null,
      product: discount.product
        ? { id: discount.product.id, name: discount.product.name }
        : null,
    };
  }

  async updateDiscount(id: number, data: UpdateDiscount) {
    const discount = await apiClient.put<DiscountResponse>(
      `${this.basePath}/${id}`,
      data
    );

    return {
      id: discount.id,
      name: discount.name,
      type: discount.type,
      value: discount.value,
      expiredAt: discount.expiredAt ? new Date(discount.expiredAt) : null,
      store: discount.store
        ? { id: discount.store.id, name: discount.store.name }
        : null,
      product: discount.product
        ? { id: discount.product.id, name: discount.product.name }
        : null,
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
export const createDiscount = (data: CreateDiscount) =>
  discountsService.createDiscount(data);
export const updateDiscount = (id: number, data: UpdateDiscount) =>
  discountsService.updateDiscount(id, data);
export const deleteDiscount = (id: number) =>
  discountsService.deleteDiscount(id);
