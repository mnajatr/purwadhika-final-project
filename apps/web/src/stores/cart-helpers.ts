import type { CartItem } from "../types/cart.types";

/**
 * Helper function untuk optimistic update cart
 */
export const updateCartOptimistically = (
  prevCart: { id: number; items: CartItem[] },
  productId: number,
  qty: number
) => {
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
  } else {
    const newItem = {
      id: Date.now(),
      cartId: prevCart.id,
      productId,
      qty,
      unitPriceSnapshot: "0",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      product: {
        id: productId,
        name: "",
        slug: "",
        description: "",
        isActive: true,
      },
    };
    return { ...prevCart, items: [...prevCart.items, newItem] };
  }
};

/**
 * Helper function update item cart
 */
export const updateCartItemOptimistically = (
  prevCart: { items: CartItem[] },
  itemId: number,
  qty: number
) => {
  const updatedItems = prevCart.items.map((item: CartItem) =>
    item.id === itemId ? { ...item, qty } : item
  );
  return { ...prevCart, items: updatedItems };
};

/**
 * Helper function remove item cart
 */
export const removeCartItemOptimistically = (
  prevCart: { items: CartItem[] },
  itemId: number
) => {
  const updatedItems = prevCart.items.filter(
    (item: CartItem) => item.id !== itemId
  );
  return { ...prevCart, items: updatedItems };
};
