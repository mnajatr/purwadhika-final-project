export type DiscountResponse = {
  id: number;
  value: "PRODUCT_DISCOUNT" | "BUY1GET1";
  type: "PERCENTAGE" | "NOMINAL";
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
};
