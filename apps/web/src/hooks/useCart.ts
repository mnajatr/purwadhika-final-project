"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { cartService } from "@/services/cart.service";
import type {
  Cart,
  AddToCartRequest,
  UpdateCartItemRequest,
} from "@/types/cart.types";
import { toast } from "sonner";
import useLocationStore from "@/stores/locationStore";
import { validateCartForCheckout } from "@/utils/cartStockUtils";

const cartQueryKey = (userId: number) => ["cart", userId];
const cartTotalsQueryKey = (userId: number) => ["cart", "totals", userId];

const handleCartError = (error: unknown) => {
  const message = error instanceof Error ? error.message : "An error occurred";

  // Convert technical error messages to user-friendly ones
  let displayMessage = message;

  if (
    message.includes("stock") ||
    message.includes("exceeds available") ||
    message.includes("Insufficient stock")
  ) {
    displayMessage =
      "Sorry, not enough stock available for the requested quantity.";
  } else if (
    message.includes("out of stock") ||
    message.includes("stock: 0") ||
    message.includes("Available: 0")
  ) {
    displayMessage = "Sorry, this product is currently out of stock.";
  } else if (message.includes("Invalid")) {
    displayMessage = "Invalid request. Please try again.";
  } else if (message.includes("authentication") || message.includes("auth")) {
    displayMessage = "Please log in to continue.";
  } else {
    displayMessage = "Something went wrong. Please try again.";
  }

  toast.error(displayMessage);

  // Only log in development
  if (process.env.NODE_ENV === "development") {
    console.warn("Cart operation failed:", error);
  }
};

export function useCart(userId: number, storeId?: number) {
  const nearestStoreId = useLocationStore((s) => s.nearestStoreId) ?? undefined;
  const effectiveStoreId = storeId ?? nearestStoreId;
  const qc = useQueryClient();

  const query = useQuery<Cart | null>({
    queryKey: cartQueryKey(userId),
    queryFn: async () => {
      const res = await cartService.getCart(userId, effectiveStoreId);
      return res.data;
    },
    enabled: Boolean(userId),
    retry: (failureCount, error) => {
      // Don't retry on validation errors
      if (error instanceof Error && error.message.includes("Invalid")) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // When the resolved store for this user changes, refetch cart and totals
  // for the user (server will resolve cart contents for that store). After
  // refetch completes, run local validation and notify the user if items
  // are out of stock. This keeps the same per-user cart key and avoids
  // creating separate client-side carts per store.
  React.useEffect(() => {
    if (!userId) return;
    // Only trigger when effective store id is defined (we rely on server)
    // to resolve when it's omitted.
    (async () => {
      try {
        await qc.refetchQueries({ queryKey: cartQueryKey(userId), exact: true });
        await qc.refetchQueries({ queryKey: cartTotalsQueryKey(userId), exact: true });

        const cached = qc.getQueryData<Cart | null>(cartQueryKey(userId));
        const items = cached?.items ?? [];
        const result = validateCartForCheckout(items);
        if (!result.isValid) {
          toast.error(`${result.outOfStockItems.length} item(s) are out of stock for the selected store. Please review your cart.`);
        }
      } catch (err) {
        // Non-fatal: avoid throwing from effect. Let existing handlers show errors.
        if (process.env.NODE_ENV === "development") console.warn("Failed refetch/validate cart on store change:", err);
      }
    })();
  }, [effectiveStoreId, userId, qc]);

  return query;
}

export function useCartTotals(userId: number, storeId?: number) {
  const nearestStoreId = useLocationStore((s) => s.nearestStoreId) ?? undefined;
  const effectiveStoreId = storeId ?? nearestStoreId;

  return useQuery({
    queryKey: cartTotalsQueryKey(userId),
    queryFn: async () => {
      const res = await cartService.getCartTotals(userId, effectiveStoreId);
      return res.data;
    },
    enabled: Boolean(userId),
    retry: (failureCount, error) => {
      // Don't retry on validation errors
      if (error instanceof Error && error.message.includes("Invalid")) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useAddToCart(userId: number, storeId?: number) {
  const qc = useQueryClient();
  const nearestStoreId = useLocationStore((s) => s.nearestStoreId) ?? undefined;
  const effectiveStoreId = storeId ?? nearestStoreId;

  return useMutation({
    mutationFn: async (data: AddToCartRequest) => {
      const res = await cartService.addToCart(data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cartQueryKey(userId) });
      qc.invalidateQueries({ queryKey: cartTotalsQueryKey(userId) });
      // Toast will be handled by the calling component
    },
    onError: (error) => {
      handleCartError(error);
    },
  });
}

export function useUpdateCartItem(userId: number, storeId?: number) {
  const qc = useQueryClient();
  const nearestStoreId = useLocationStore((s) => s.nearestStoreId) ?? undefined;
  const effectiveStoreId = storeId ?? nearestStoreId;

  return useMutation({
    mutationFn: async (payload: { itemId: number; qty: number }) => {
      const data: UpdateCartItemRequest = { qty: payload.qty, userId };
      const res = await cartService.updateCartItem(
        payload.itemId,
        data,
        effectiveStoreId
      );
      return res.data;
    },
    // optimistic update: apply local change immediately, rollback on error
    onMutate: async (payload: { itemId: number; qty: number }) => {
      await qc.cancelQueries({ queryKey: cartQueryKey(userId) });
      const previous = qc.getQueryData<Cart | null>(cartQueryKey(userId));

      qc.setQueryData<Cart | null>(cartQueryKey(userId), (old) => {
        if (!old) return old;
        const items = old.items?.map((it) =>
          it.id === payload.itemId ? { ...it, qty: payload.qty } : it
        );
        return { ...old, items } as Cart;
      });

      return { previous };
    },
    onError: (err, _vars, context?: { previous?: Cart | null }) => {
      if (context?.previous) {
        qc.setQueryData(cartQueryKey(userId), context.previous);
      }
      handleCartError(err);
    },
    onSuccess: () => {
      // No generic success toast here; components can show a toast when
      // the update was initiated directly by the user to avoid spam.
    },
    // Intentionally no onSettled invalidation: we keep optimistic local state
    // and avoid immediate refetch on quantity changes per assignment requirements.
  });
}

export function useRemoveCartItem(userId: number, storeId?: number) {
  const qc = useQueryClient();
  const nearestStoreId = useLocationStore((s) => s.nearestStoreId) ?? undefined;
  const effectiveStoreId = storeId ?? nearestStoreId;
  return useMutation({
    mutationFn: async (itemId: number) => {
      const res = await cartService.removeCartItem(itemId, userId, effectiveStoreId);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cartQueryKey(userId) });
      qc.invalidateQueries({ queryKey: cartTotalsQueryKey(userId) });
      // Intentionally no generic success toast here. Components (which
      // initiated the action) should show contextual messages to avoid
      // duplicate notifications when removals are triggered by background
      // flows (auto-adjust, order sync).
    },
    onError: (error) => {
      handleCartError(error);
    },
  });
}

export function useClearCart(userId: number, storeId?: number) {
  const qc = useQueryClient();
  const nearestStoreId = useLocationStore((s) => s.nearestStoreId) ?? undefined;
  const effectiveStoreId = storeId ?? nearestStoreId;
  return useMutation({
    mutationFn: async () => {
      const res = await cartService.clearCart(userId, effectiveStoreId);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cartQueryKey(userId) });
      qc.invalidateQueries({ queryKey: cartTotalsQueryKey(userId) });
      toast.success("Cart cleared");
    },
    onError: (error) => {
      handleCartError(error);
    },
  });
}

export default useCart;
