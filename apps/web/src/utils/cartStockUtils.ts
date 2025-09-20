import type { CartItemResponse as CartItem } from "@repo/schemas";

export function isCartItemOutOfStock(item: CartItem): boolean {
  return item.storeInventory?.stockQty === 0;
}

export function isCartItemQuantityExceedsStock(item: CartItem): boolean {
  const stockQty = item.storeInventory?.stockQty ?? 0;
  return item.qty > stockQty;
}

export function getItemsNeedingQuantityAdjustment(
  cartItems: CartItem[]
): CartItem[] {
  return cartItems.filter(isCartItemQuantityExceedsStock);
}

export function getAdjustedQuantity(item: CartItem): number {
  const stockQty = item.storeInventory?.stockQty ?? 0;
  if (stockQty === 0) return 0;
  return Math.min(item.qty, stockQty);
}

export function getRemainingStock(item: CartItem): number {
  return item.storeInventory?.stockQty ?? 0;
}

export function validateCartForCheckout(cartItems: CartItem[]) {
  const outOfStockItems = cartItems.filter(isCartItemOutOfStock);

  return {
    isValid: outOfStockItems.length === 0,
    outOfStockItems,
    hasOutOfStockItems: outOfStockItems.length > 0,
  };
}

export function hasOutOfStockItems(cartItems: CartItem[]): boolean {
  return cartItems.some(isCartItemOutOfStock);
}

export function filterOutOfStockItems(cartItems: CartItem[]): CartItem[] {
  return cartItems.filter((item) => !isCartItemOutOfStock(item));
}

export function getOutOfStockItems(cartItems: CartItem[]): CartItem[] {
  return cartItems.filter(isCartItemOutOfStock);
}
