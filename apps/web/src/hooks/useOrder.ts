"use client";

import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { orderService } from "@/services/order.service";
import type { ApiResponse } from "@/types/api";

// Lightweight order shape used by client hooks
export type OrderDetail = {
  id: number;
  status: string;
  grandTotal?: number;
  items: Array<{
    id: number;
    productId: number;
    qty: number;
    totalAmount?: number;
    product?: { id: number; name?: string; price?: number } | null;
  }>;
  payment?: { status?: string; amount?: number } | null;
  paymentMethod?: string | null;
  address?: {
    recipientName: string;
    addressLine: string;
    city: string;
    province: string;
    postalCode: string;
  } | null;
};
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
export function useCreateOrder(userId: number, storeId?: number) {
  const qc = useQueryClient();

  type Payload = {
    items: Array<{ productId: number; qty: number }>;
    idempotencyKey?: string;
    userLat?: number;
    userLon?: number;
    addressId?: number;
  };

  return useMutation({
    // accept either: { items } or { items, idempotencyKey }
    mutationFn: async (payload: Payload) => {
      const { items, idempotencyKey, userLat, userLon, addressId } = payload;
      const key = idempotencyKey ?? uuidv4();
      const res = await orderService.createOrder(
        userId,
        storeId,
        items,
        key,
        userLat,
        userLon,
        addressId
      );
      return res.data;
    },
    onSuccess: async (data) => {
      // service may return either { data: order } or order directly
      // normalize to created order object with a small runtime guard
      type CreatedOrderShape = {
        id?: number;
        storeId?: number;
        items?: Array<{ productId: number; qty?: number }>;
        order?: {
          id?: number;
          storeId?: number;
          items?: Array<{ productId: number; qty?: number }>;
        };
      };

      function isWrapped(obj: unknown): obj is { data: CreatedOrderShape } {
        return !!obj && typeof obj === "object" && "data" in obj;
      }

      const created: CreatedOrderShape = isWrapped(data)
        ? data.data
        : (data as CreatedOrderShape);

      // determine resolved storeId from created order (backend selected store)
      const resolvedStoreId: number | undefined =
        created?.storeId ?? created?.order?.storeId ?? undefined;

      // If we have created.order.items (array with productId), remove only matching cart items
      try {
        const createdItems: Array<{ productId: number; qty?: number }> =
          created?.items ?? created?.order?.items ?? [];

        if (createdItems.length > 0 && typeof resolvedStoreId === "number") {
          // read current cart from cache to find item ids to remove
          type CartCache = {
            items?: Array<{ id: number; productId: number }>;
          } | null;
          const cartCache = qc.getQueryData<CartCache>([
            "cart",
            userId,
            resolvedStoreId,
          ]);
          const cartItems = cartCache?.items ?? [];

          const toRemove = cartItems.filter((ci) =>
            createdItems.some((it) => it.productId === ci.productId)
          );

          // remove matching cart items (sequentially)
          for (const it of toRemove) {
            try {
              await cartService.removeCartItem(it.id, userId, resolvedStoreId);
            } catch (err) {
              // ignore per-item removal errors; we'll invalidate cache anyway
              console.warn("Failed to remove cart item", it.id, err);
            }
          }

          qc.invalidateQueries({ queryKey: ["cart", userId, resolvedStoreId] });
          qc.invalidateQueries({
            queryKey: ["cart", "totals", userId, resolvedStoreId],
          });
        }
      } catch (err) {
        console.warn("Failed to sync cart after order creation", err);
      }

      // navigate to the created order detail page if we have an id
      try {
        const id = created?.id ?? created?.order?.id;
        if (id) {
          window.location.href = `/orders/${id}`;
        }
      } catch (err) {
        console.warn("Failed to redirect to order detail", err);
      }
    },
    onError: async (err) => {
      // bubble up server message so consuming components can show friendly UI
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        e?.response?.data?.message || e?.message || "Failed to place order";
      // option: invalidate cart to refresh latest inventory state (only when storeId is known)
      if (typeof storeId === "number") {
        qc.invalidateQueries({ queryKey: ["cart", userId, storeId] });
        qc.invalidateQueries({ queryKey: ["cart", "totals", userId, storeId] });
      }
      throw new Error(message);
    },
  });
}

export default useCreateOrder;

// Hook: get single order by id
export function useGetOrder(id?: number | null) {
  return useQuery<OrderDetail | null, Error>({
    queryKey: ["order", id],
    enabled: typeof id === "number" && !Number.isNaN(id),
    queryFn: async () => {
      if (typeof id !== "number" || Number.isNaN(id)) {
        throw new Error("Invalid order id");
      }
      const raw = await orderService.getOrder(id);
      const res = raw as ApiResponse<OrderDetail>;
      // normalized payload under .data per API convention
      return (res && (res.data ?? null)) as OrderDetail | null;
    },
    // keep default staleTime behavior from provider; retry once on failure
    retry: 1,
  });
}

// Hook: cancel an order (manual cancel)
export function useCancelOrder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (opts: { orderId: number; userId?: number }) => {
      const { orderId, userId } = opts;
      const res = await orderService.cancelOrder(orderId, userId);
      return res.data;
    },
    onSuccess: (_data, vars) => {
      const orderId = (vars as { orderId: number }).orderId;
      try {
        // update cache immediately so UI reflects cancellation without waiting
        qc.setQueryData<OrderDetail | null>(["order", orderId], (prev) =>
          prev ? { ...prev, status: "CANCELLED" } : ({ id: orderId, status: "CANCELLED", items: [] } as OrderDetail)
        );
      } catch (err) {
        console.warn("Failed to set order cache after cancel", err);
      }

      try {
        qc.invalidateQueries({ queryKey: ["order", orderId] });
      } catch (err) {
        console.warn("Failed to invalidate order cache", err);
      }
    },
  });
}
