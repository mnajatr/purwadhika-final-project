"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import useLocationStore from "@/stores/locationStore";
import { useCart } from "./useCart";
import { validateCartForCheckout } from "@/utils/cartStockUtils";
import { toast } from "sonner";
import type { Cart } from "@/types/cart.types";

/**
 * Hook that ties cart behavior to active address / nearest store.
 * - Listens to nearestStoreId from location store.
 * - When store changes, invalidates cart queries to fetch latest inventory for that store.
 * - Runs stock validation using existing utils and notifies user if some items are out of stock.
 * - Does NOT reset or recreate the cart; items and quantities are preserved.
 */
export function useSmartCart(userId: number) {
  const queryClient = useQueryClient();
  const previousStoreRef = useRef<number | null>(null);
  const nearestStoreId = useLocationStore((s) => s.nearestStoreId) ?? null;
  const storeId = nearestStoreId ?? 1;

  // Expose cart for current resolved store
  const { data: cart, isLoading: isCartLoading } = useCart(userId, storeId);

  // local state to indicate last validation result
  const [validation, setValidation] = useState<{ isValid: boolean; outOfStockCount: number } | null>(null);

  useEffect(() => {
    const prev = previousStoreRef.current;
    // if store has changed (and we had a previous one), trigger validation flow
    if (prev !== null && prev !== storeId) {
      // If we have a cached cart for the previous store, copy it onto the
      // new store key so the UI continues to show the same products/qtys.
      // This avoids visually 'clearing' the cart when the nearest store
      // changes. We still invalidate to refresh inventory info from server
      // and run validation.
      try {
        const prevCart = queryClient.getQueryData<Cart | null>(["cart", userId, prev]);
        if (prevCart) {
          queryClient.setQueryData<Cart | null>(["cart", userId, storeId], prevCart);
        }
  const prevTotals = queryClient.getQueryData<unknown>(["cart", "totals", userId, prev]);
        if (prevTotals) {
          queryClient.setQueryData(["cart", "totals", userId, storeId], prevTotals);
        }
      } catch (err) {
        // swallow — defensive: don't block the flow if cache operations fail
        console.warn("Failed to copy previous cart to new store key:", err);
      }

      // invalidate queries for the new store to refresh item inventory data
      queryClient.invalidateQueries({ queryKey: ["cart", userId, storeId] });
      queryClient.invalidateQueries({ queryKey: ["cart", "totals", userId, storeId] });

      // after invalidation we can read the (possibly updated) cart from cache
      // run validation and notify user about problems without clearing the cart
      setTimeout(() => {
        const cached = queryClient.getQueryData<Cart | null>(["cart", userId, storeId]);
        const items = cached?.items ?? [];
        const result = validateCartForCheckout(items);
        setValidation({ isValid: result.isValid, outOfStockCount: result.outOfStockItems.length });
        if (!result.isValid) {
          toast.error(`${result.outOfStockItems.length} item(s) are out of stock for the selected store. Please review your cart.`);
        } else if (result.hasOutOfStockItems) {
          // unlikely path since isValid false when outOfStock exists, but keep for completeness
          toast.error("Some items are out of stock for the selected store.");
        } else {
          // no issues
        }
      }, 200);
    }

    previousStoreRef.current = storeId;
  }, [storeId, userId, queryClient]);

  return {
    cart,
    isCartLoading,
    storeId,
    validation,
  };
}

export default useSmartCart;
