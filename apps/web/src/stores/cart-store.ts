import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { createCartActions } from "./cart-actions";
import type { Cart, CartTotals } from "../types/cart.types";

interface CartState {
  cart: Cart | null;
  totals: CartTotals | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  storeId: number;
  itemCount: number;
  totalAmount: number;
  isEmpty: boolean;

  // Simple actions
  setStoreId: (storeId: number) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Complex actions (from cart-actions.ts)
  updateComputedValues: () => void;
  initializeCart: (userId: number) => Promise<void>;
  addToCart: (productId: number, qty: number, userId: number) => Promise<void>;
  updateCartItem: (
    itemId: number,
    qty: number,
    userId: number
  ) => Promise<void>;
  removeCartItem: (itemId: number, userId: number) => Promise<void>;
  clearCart: (userId: number) => Promise<void>;
  refreshCart: (userId: number) => Promise<void>;
  refreshTotals: (userId: number) => Promise<void>;
}

export const useCartStore = create<CartState>()(
  devtools(
    (set, get) => ({
      // Initial state
      cart: null,
      totals: null,
      isLoading: false,
      error: null,
      isInitialized: false,
      storeId: 1,
      itemCount: 0,
      totalAmount: 0,
      isEmpty: true,

      // Simple actions
      setStoreId: (storeId: number) => set({ storeId }),
      clearError: () => set({ error: null }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),

      // Complex actions from cart-actions.ts
      ...createCartActions(set, get),
    }),
    { name: "cart-store" }
  )
);
