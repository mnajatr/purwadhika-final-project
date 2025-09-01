import { cartService } from "../services/cart.service";
import {
  handleApiError,
  showCartErrorMessage,
  showCartSuccessMessage,
} from "../lib/cart-utils";
import type {
  AddToCartRequest,
  UpdateCartItemRequest,
  CartItem,
} from "../types/cart.types";
import {
  updateCartOptimistically,
  updateCartItemOptimistically,
  removeCartItemOptimistically,
} from "./cart-helpers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createCartActions = (set: any, get: any) => {
  return {
    updateComputedValues: () => {
      const state = get();
      const cart = state.cart;
      const itemCount = cart?.items?.length || 0;

      // Hitung total amount dari items di cart
      const totalAmount =
        cart?.items?.reduce((sum: number, item: CartItem) => {
          const unitPrice = Number(item.unitPriceSnapshot) || 0;
          return sum + unitPrice * item.qty;
        }, 0) || 0;

      const isEmpty = !cart || (cart.items?.length || 0) === 0;
      set({ itemCount, totalAmount, isEmpty });
    },
    initializeCart: async (userId: number) => {
      const storeId = get().storeId;
      if (get().isInitialized) return;
      set({ isLoading: true, error: null });
      try {
        const [cartResponse, totalsResponse] = await Promise.all([
          cartService.getCart(userId, storeId),
          cartService.getCartTotals(userId, storeId),
        ]);
        set({
          cart: cartResponse.data,
          totals: totalsResponse.data,
          isLoading: false,
          isInitialized: true,
        });
        get().updateComputedValues();
      } catch (error) {
        const cartError = handleApiError(error);
        set({
          error: cartError.message,
          isLoading: false,
          isInitialized: true,
        });
        showCartErrorMessage(cartError.message);
      }
    },

    addToCart: async (productId: number, qty: number, userId: number) => {
      const storeId = get().storeId;
      const prevCart = get().cart;

      // Optimistic update
      if (prevCart) {
        const updatedCart = updateCartOptimistically(prevCart, productId, qty);
        set({ cart: updatedCart, error: null });
        get().updateComputedValues();
      }

      // API call
      try {
        const data: AddToCartRequest = { productId, qty, storeId, userId };
        const response = await cartService.addToCart(data);
        set({ cart: response.data });
        get().updateComputedValues();
        showCartSuccessMessage("Item added to cart successfully");
      } catch (error) {
        set({ cart: prevCart });
        const cartError = handleApiError(error);
        set({ error: cartError.message });
        showCartErrorMessage(cartError.message);
      }
    },

    updateCartItem: async (itemId: number, qty: number, userId: number) => {
      const storeId = get().storeId;
      const prevCart = get().cart;
      if (!prevCart) return;

      // Optimistic update
      const updatedCart = updateCartItemOptimistically(prevCart, itemId, qty);
      set({ cart: updatedCart, error: null });
      get().updateComputedValues();

      try {
        const data: UpdateCartItemRequest = { qty, userId, storeId };
        const response = await cartService.updateCartItem(itemId, data);
        set({ cart: response.data });
        get().updateComputedValues();
        showCartSuccessMessage("Cart item updated successfully");
      } catch (error) {
        set({ cart: prevCart });
        const cartError = handleApiError(error);
        set({ error: cartError.message });
        showCartErrorMessage(cartError.message);
      }
    },

    removeCartItem: async (itemId: number, userId: number) => {
      const storeId = get().storeId;
      const prevCart = get().cart;
      if (!prevCart) return;

      // Optimistic update
      const updatedCart = removeCartItemOptimistically(prevCart, itemId);
      set({ cart: updatedCart, error: null });
      get().updateComputedValues();

      try {
        const response = await cartService.removeCartItem(
          itemId,
          userId,
          storeId
        );
        set({ cart: response.data });
        get().updateComputedValues();
        showCartSuccessMessage("Item removed from cart");
      } catch (error) {
        set({ cart: prevCart });
        get().updateComputedValues();
        const cartError = handleApiError(error);
        set({ error: cartError.message });
        showCartErrorMessage(cartError.message);
      }
    },

    clearCart: async (userId: number) => {
      const storeId = get().storeId;
      set({ isLoading: true, error: null });
      try {
        await cartService.clearCart(userId, storeId);
        set({
          cart: null,
          totals: null,
          isLoading: false,
          isInitialized: false,
        });
        get().updateComputedValues();
        showCartSuccessMessage("Cart cleared successfully");
      } catch (error) {
        const cartError = handleApiError(error);
        set({ error: cartError.message, isLoading: false });
        showCartErrorMessage(cartError.message);
      }
    },

    refreshCart: async (userId: number) => {
      const storeId = get().storeId;
      set({ isLoading: true, error: null });
      try {
        const response = await cartService.getCart(userId, storeId);
        set({ cart: response.data, isLoading: false });
        get().updateComputedValues();
      } catch (error) {
        const cartError = handleApiError(error);
        set({ error: cartError.message, isLoading: false });
      }
    },

    refreshTotals: async (userId: number) => {
      const storeId = get().storeId;
      try {
        const response = await cartService.getCartTotals(userId, storeId);
        set({ totals: response.data });
      } catch (error) {
        const cartError = handleApiError(error);
        set({ error: cartError.message });
      }
    },
  };
};
