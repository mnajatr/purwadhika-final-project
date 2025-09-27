export enum ValueType {
  PRODUCT_DISCOUNT = "PRODUCT_DISCOUNT",
  BUY1GET1 = "BUY1GET1",
}

export enum DiscountType {
  PERCENTAGE = "PERCENTAGE",
  NOMINAL = "NOMINAL",
  BUYXGETX = "BUYXGETX",
}

export interface CreateDiscount {
  name: string;
  value: ValueType;
  type: DiscountType;
  amount?: number;
  minPurchase?: number;
  maxDiscount?: number;
  buyQty?: number;
  getQty?: number;
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
  amount?: number;
  minPurchase?: number;
  maxDiscount?: number;
  buyQty?: number;
  getQty?: number;
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
