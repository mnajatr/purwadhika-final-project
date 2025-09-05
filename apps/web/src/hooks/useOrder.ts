"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orderService } from "@/services/order.service";
import { cartService } from "@/services/cart.service";

// Tiny UUIDv4 generator (no deps) for idempotency keys in the client
function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Hook: createOrder with client-generated idempotency key
export function useCreateOrder(userId: number, storeId = 1) {
  const qc = useQueryClient();

  type Payload = {
    items: Array<{ productId: number; qty: number }>;
    idempotencyKey?: string;
  };

  return useMutation({
    // accept either: { items } or { items, idempotencyKey }
    mutationFn: async (payload: Payload) => {
      const { items, idempotencyKey } = payload;
      const key = idempotencyKey ?? uuidv4();
      const res = await orderService.createOrder(userId, storeId, items, key);
      return res.data;
    },
    onSuccess: async () => {
      // clear cart and refresh
      await cartService.clearCart(userId, storeId);
      qc.invalidateQueries({ queryKey: ["cart", userId, storeId] });
      qc.invalidateQueries({ queryKey: ["cart", "totals", userId, storeId] });
    },
    onError: async (err) => {
      // bubble up server message so consuming components can show friendly UI
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        e?.response?.data?.message || e?.message || "Failed to place order";
      // option: invalidate cart to refresh latest inventory state
      qc.invalidateQueries({ queryKey: ["cart", userId, storeId] });
      qc.invalidateQueries({ queryKey: ["cart", "totals", userId, storeId] });
      throw new Error(message);
    },
  });
}

export default useCreateOrder;
