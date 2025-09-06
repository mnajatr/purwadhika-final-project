import { ApiResponse, ValidationError } from "../types/api.js";

export const successResponse = <T>(
  data: T,
  message?: string
): ApiResponse<T> => ({
  success: true,
  message,
  data,
});

export const errorResponse = (
  message: string,
  error?: string,
  errors?: ValidationError[]
): ApiResponse => ({
  success: false,
  message,
  error,
  errors,
});

export const CART_CONSTANTS = {
  MAX_CART_ITEMS: 50,
  MAX_ITEM_QUANTITY: 99,
  MIN_ITEM_QUANTITY: 1,
} as const;

export const ERROR_MESSAGES = {
  STORE: {
    NO_NEARBY: "No store within service radius",
  },
  CART: {
    ITEM_NOT_FOUND: "Cart item not found",
    CART_NOT_FOUND: "Cart not found",
    MAX_ITEMS_EXCEEDED: `Cart cannot exceed ${CART_CONSTANTS.MAX_CART_ITEMS} different items`,
    MAX_QUANTITY_EXCEEDED: `Quantity cannot exceed ${CART_CONSTANTS.MAX_ITEM_QUANTITY} per item`,
    TOTAL_QUANTITY_EXCEEDED: `Total quantity cannot exceed ${CART_CONSTANTS.MAX_ITEM_QUANTITY} per item`,
  },
  PRODUCT: {
    NOT_FOUND: "Product not found",
    NOT_AVAILABLE: "Product is not available",
    NOT_IN_STORE: "Product not available in this store",
  },
  INVENTORY: {
    INSUFFICIENT_STOCK: "Insufficient stock",
    NO_INVENTORY: "Product not available in any store",
  },
} as const;
