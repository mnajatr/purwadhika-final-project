import type { CartItem } from "@/types/cart.types";

export function isCartItemOutOfStock(item: CartItem): boolean {
  return item.storeInventory?.stockQty === 0;
}

export function validateCartForCheckout(cartItems: CartItem[]) {
  const outOfStockItems = cartItems.filter(isCartItemOutOfStock);
  
  return {
    isValid: outOfStockItems.length === 0,
    outOfStockItems,
    hasOutOfStockItems: outOfStockItems.length > 0
  };
}

export function hasOutOfStockItems(cartItems: CartItem[]): boolean {
  return cartItems.some(isCartItemOutOfStock);
}

export function filterOutOfStockItems(cartItems: CartItem[]): CartItem[] {
  return cartItems.filter(item => !isCartItemOutOfStock(item));
}

export function getOutOfStockItems(cartItems: CartItem[]): CartItem[] {
  return cartItems.filter(isCartItemOutOfStock);
}