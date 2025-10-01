import apiClient from "@/lib/axios-client";
import {
  DiscountResponse,
  CreateDiscount,
  UpdateDiscount,
} from "@/types/discount.types";
import { paginationData } from "./category.service";

class DiscountsService {
  private readonly basePath = "/discounts";

  async getDiscounts(page: number) {
    const params: Record<string, unknown> = {};
    params.page = page;
    const response = await apiClient.get<paginationData<DiscountResponse[]>>(
      this.basePath,
      params
    );
    console.log(response);

    return {
      data: response.data.map((discount) => ({
        id: discount.id,
        name: discount.name,
        type: discount.type,
        value: discount.value,
        amount: discount.amount ?? null,
        minPurchase: discount.minPurchase ?? null,
        maxDiscount: discount.maxDiscount ?? null,
        buyQty: discount.buyQty ?? null,
        getQty: discount.getQty ?? null,
        expiredAt: discount.expiredAt ? new Date(discount.expiredAt) : null,
        store: discount.store
          ? { id: discount.store.id, name: discount.store.name }
          : null,
        product: discount.product
          ? { id: discount.product.id, name: discount.product.name }
          : null,
      })),
      total: response.total,
      page: response.page,
      limit: response.limit,
    };
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
      amount: discount.amount ?? null,
      minPurchase: discount.minPurchase ?? null,
      maxDiscount: discount.maxDiscount ?? null,
      buyQty: discount.buyQty ?? null,
      getQty: discount.getQty ?? null,
      expiredAt: discount.expiredAt ? new Date(discount.expiredAt) : null,
      store: discount.store
        ? { id: discount.store.id, name: discount.store.name }
        : null,
      product: discount.product
        ? { id: discount.product.id, name: discount.product.name }
        : null,
    };
  }

  async getDiscountsByProductIds(productIds: number[]) {
    const discounts = await apiClient.post<DiscountResponse[]>(
      `${this.basePath}/by-products`,
      { productIds }
    );

    return discounts.map((discount) => ({
      id: discount.id,
      name: discount.name,
      type: discount.type,
      value: discount.value,
      amount: discount.amount ?? null,
      minPurchase: discount.minPurchase ?? null,
      maxDiscount: discount.maxDiscount ?? null,
      buyQty: discount.buyQty ?? null,
      getQty: discount.getQty ?? null,
      expiredAt: discount.expiredAt ? new Date(discount.expiredAt) : null,
      store: discount.store
        ? { id: discount.store.id, name: discount.store.name }
        : null,
      product: discount.product
        ? { id: discount.product.id, name: discount.product.name }
        : null,
    }));
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
      amount: discount.amount ?? null,
      minPurchase: discount.minPurchase ?? null,
      maxDiscount: discount.maxDiscount ?? null,
      buyQty: discount.buyQty ?? null,
      getQty: discount.getQty ?? null,
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
      amount: discount.amount ?? null,
      minPurchase: discount.minPurchase ?? null,
      maxDiscount: discount.maxDiscount ?? null,
      buyQty: discount.buyQty ?? null,
      getQty: discount.getQty ?? null,
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

export const getDiscounts = (page: number) =>
  discountsService.getDiscounts(page);
export const getDiscountById = (id: number) =>
  discountsService.getDiscountById(id);
export const getDiscountsByProductIds = (productIds: number[]) =>
  discountsService.getDiscountsByProductIds(productIds);
export const createDiscount = (data: CreateDiscount) =>
  discountsService.createDiscount(data);
export const updateDiscount = (id: number, data: UpdateDiscount) =>
  discountsService.updateDiscount(id, data);
export const deleteDiscount = (id: number) =>
  discountsService.deleteDiscount(id);
