import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { createCartActions } from "./cart-actions";
import type { CartStoreState } from "../types/cart.types";

export const useCartStore = create<CartStoreState>()(
  devtools(
    (set, get) => ({
      cart: null,
      totals: null,
      isLoading: false,
      error: null,
      isInitialized: false,
      storeId: 1,
      itemCount: 0,
      totalAmount: 0,
      isEmpty: true,

      setStoreId: (storeId: number) => set({ storeId }),
      clearError: () => set({ error: null }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),

      ...createCartActions(set, get),
    }),
    { name: "cart-store" }
  )
);
