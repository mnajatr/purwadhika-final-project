export enum ValueType {
  PRODUCT_DISCOUNT = "PRODUCT_DISCOUNT",
  BUY1GET1 = "BUY1GET1",
}

export enum DiscountType {
  PERCENTAGE = "PERCENTAGE",
  NOMINAL = "NOMINAL",
}

export interface CreateDiscount {
  name: string;
  value: ValueType;
  type: DiscountType;
  minPurchase?: number;
  maxDiscount?: number;
  expiredAt: string;
  store: { id: number };
  product: { id: number };
}

export type UpdateDiscount = Partial<CreateDiscount>;

export interface DiscountResponse {
  id: number;
  name: string;
  value: ValueType;
  type: DiscountType;
  minPurchase?: number;
  maxDiscount?: number;
  expiredAt: string;
  store: {
    id: number;
    name: string;
  };
  product: {
    id: number;
    name: string;
  };
}
