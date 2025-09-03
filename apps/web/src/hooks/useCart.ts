"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cartService } from "@/services/cart.service";
import type {
  Cart,
  AddToCartRequest,
  UpdateCartItemRequest,
} from "@/types/cart.types";

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

export function useCart(userId: number, storeId = 1) {
  return useQuery<Cart | null>({
    queryKey: cartQueryKey(userId, storeId),
    queryFn: async () => {
      const res = await cartService.getCart(userId, storeId);
      return res.data;
    },
    enabled: Boolean(userId),
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
    },
  });
}

export function useUpdateCartItem(userId: number, storeId = 1) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { itemId: number; qty: number }) => {
      const data: UpdateCartItemRequest = { qty: payload.qty, userId, storeId };
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
    },
  });
}

export default useCart;
