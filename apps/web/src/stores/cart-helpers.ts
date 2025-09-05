import type { CartItem, Cart } from "../types/cart.types";

/**
 * Helper function untuk optimistic update cart
 */
export const updateCartOptimistically = (
  prevCart: Cart,
  productId: number,
  qty: number
): Cart => {
  const existingItem = prevCart.items.find(
    (item: CartItem) => item.productId === productId
  );

  if (existingItem) {
    return {
      ...prevCart,
      items: prevCart.items.map((item: CartItem) =>
        item.productId === productId ? { ...item, qty: item.qty + qty } : item
      ),
    };
  }

  const newItem: CartItem = {
    id: Date.now(),
    productId,
    qty,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    product: {
      id: productId,
      name: "",
      slug: "",
      description: null,
      price: 0,
      isActive: true,
    },
  };
  return { ...prevCart, items: [...prevCart.items, newItem] };
};

/**
 * Helper function update item cart
 */
export const updateCartItemOptimistically = (
  prevCart: Cart,
  itemId: number,
  qty: number
): Cart => {
  const updatedItems = prevCart.items.map((item: CartItem) =>
    item.id === itemId ? { ...item, qty } : item
  );
  return { ...prevCart, items: updatedItems };
};

/**
 * Helper function remove item cart
 */
export const removeCartItemOptimistically = (
  prevCart: Cart,
  itemId: number
): Cart => {
  const updatedItems = prevCart.items.filter(
    (item: CartItem) => item.id !== itemId
  );
  return { ...prevCart, items: updatedItems };
};
