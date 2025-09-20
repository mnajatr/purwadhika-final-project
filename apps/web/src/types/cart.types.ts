// Re-export cart-related types from the shared schemas package so frontend
// uses the same contract as the backend while keeping local import paths.
import type {
  CartItemResponse,
  CartResponse,
  CartTotals as CartTotalsType,
  AddToCartInput,
  UpdateCartItemInput,
  CartItemParams,
} from "@repo/schemas";

export type CartItem = CartItemResponse;
export type Cart = CartResponse;
export type CartTotals = CartTotalsType;
export type AddToCartRequest = AddToCartInput;
export type UpdateCartItemRequest = UpdateCartItemInput;
export type { CartItemParams };
