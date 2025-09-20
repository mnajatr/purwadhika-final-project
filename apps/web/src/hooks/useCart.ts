"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cartService } from "@/services/cart.service";
import type {
  Cart,
  AddToCartRequest,
  UpdateCartItemRequest,
} from "@/types/cart.types";
import { toast } from "sonner";

const cartQueryKey = (userId: number, storeId: number) => [
  "cart",
  userId,
  storeId,
];
const cartTotalsQueryKey = (userId: number, storeId: number) => [
  "cart",
  "totals",
  userId,
  storeId,
];

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

export function useCart(userId: number, storeId = 1) {
  return useQuery<Cart | null>({
    queryKey: cartQueryKey(userId, storeId),
    queryFn: async () => {
      const res = await cartService.getCart(userId, storeId);
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

export function useCartTotals(userId: number, storeId = 1) {
  return useQuery({
    queryKey: cartTotalsQueryKey(userId, storeId),
    queryFn: async () => {
      const res = await cartService.getCartTotals(userId, storeId);
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

export function useAddToCart(userId: number, storeId = 1) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: AddToCartRequest) => {
      const res = await cartService.addToCart(data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cartQueryKey(userId, storeId) });
      qc.invalidateQueries({ queryKey: cartTotalsQueryKey(userId, storeId) });
      // Toast will be handled by the calling component
    },
    onError: (error) => {
      handleCartError(error);
    },
  });
}

export function useUpdateCartItem(userId: number, storeId = 1) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { itemId: number; qty: number }) => {
      const data: UpdateCartItemRequest = { qty: payload.qty, userId };
      const res = await cartService.updateCartItem(payload.itemId, data);
      return res.data;
    },
    // optimistic update: apply local change immediately, rollback on error
    onMutate: async (payload: { itemId: number; qty: number }) => {
      await qc.cancelQueries({ queryKey: cartQueryKey(userId, storeId) });
      const previous = qc.getQueryData<Cart | null>(
        cartQueryKey(userId, storeId)
      );

      qc.setQueryData<Cart | null>(cartQueryKey(userId, storeId), (old) => {
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
        qc.setQueryData(cartQueryKey(userId, storeId), context.previous);
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

export function useRemoveCartItem(userId: number, storeId = 1) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: number) => {
      const res = await cartService.removeCartItem(itemId, userId, storeId);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cartQueryKey(userId, storeId) });
      qc.invalidateQueries({ queryKey: cartTotalsQueryKey(userId, storeId) });
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

export function useClearCart(userId: number, storeId = 1) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await cartService.clearCart(userId, storeId);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cartQueryKey(userId, storeId) });
      qc.invalidateQueries({ queryKey: cartTotalsQueryKey(userId, storeId) });
      toast.success("Cart cleared");
    },
    onError: (error) => {
      handleCartError(error);
    },
  });
}

export default useCart;
