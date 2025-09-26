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
  percentage?: number;
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
  amount?: number | null;
  percentage?: number | null;
  minPurchase?: number | null;
  maxDiscount?: number | null;
  buyQty?: number | null;
  getQty?: number | null;
  expiredAt: string | Date | null;
  store: {
    id: number;
    name: string;
  } | null;
  product: {
    id: number;
    name: string;
  } | null;
}

export interface AppliedDiscount {
  id: number;
  name: string;
  value: ValueType;
  type: DiscountType;
  amount?: number;
  percentage?: number;
  minPurchase?: number;
  maxDiscount?: number;
  buyQty?: number;
  getQty?: number;
  expiredAt: string | Date | null;
  productId?: number;
  storeId?: number;
}
