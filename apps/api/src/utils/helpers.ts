import { ApiResponse, ValidationError } from "../types/api.js";

// Response helpers
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

// Business logic constants
export const CART_CONSTANTS = {
  MAX_CART_ITEMS: 50,
  MAX_ITEM_QUANTITY: 99,
  MIN_ITEM_QUANTITY: 1,
} as const;

// Validation helpers
// export const isValidUUID = (uuid: string): boolean => {
//   const uuidRegex =
//     /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
//   return uuidRegex.test(uuid);
// };

// Error messages
export const ERROR_MESSAGES = {
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
  // VALIDATION: {
  //   INVALID_UUID: "Invalid UUID format",
  //   INVALID_QUANTITY: `Quantity must be between ${CART_CONSTANTS.MIN_ITEM_QUANTITY} and ${CART_CONSTANTS.MAX_ITEM_QUANTITY}`,
  //   REQUIRED_FIELD: "This field is required",
  // },
} as const;
