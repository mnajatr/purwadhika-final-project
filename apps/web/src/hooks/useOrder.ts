"use client";

import * as React from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { orderService } from "@/services/order.service";
import type { ApiResponse } from "@/types/api";

// Lightweight order shape used by client hooks
export type OrderDetail = {
  id: number;
  status: string;
  grandTotal?: number;
  createdAt?: string | Date | null;
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
    paymentMethod?: string;
    shippingMethod?: string;
    shippingOption?: string;
  };

  return useMutation({
    // accept either: { items } or { items, idempotencyKey }
    mutationFn: async (payload: Payload) => {
      const {
        items,
        idempotencyKey,
        userLat,
        userLon,
        addressId,
        paymentMethod,
        shippingMethod,
        shippingOption,
      } = payload;
      const key = idempotencyKey ?? uuidv4();
      const res = await orderService.createOrder(
        userId,
        storeId,
        items,
        key,
        userLat,
        userLon,
        addressId,
        paymentMethod,
        shippingMethod,
        shippingOption
      );
      return res.data;
    },
    onSuccess: (data, variables) => {
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

      // Store order info and payment method for post-success handling
      const orderId = created?.id ?? created?.order?.id;
      const paymentMethod = variables?.paymentMethod;

      if (orderId) {
        // Update payment session with actual order ID (best-effort)
        try {
          const pendingPaymentStr = sessionStorage.getItem("pendingPayment");
          if (pendingPaymentStr) {
            const pendingPayment = JSON.parse(pendingPaymentStr);
            pendingPayment.orderId = orderId;
            sessionStorage.setItem(
              "pendingPayment",
              JSON.stringify(pendingPayment)
            );
          }
        } catch (error) {
          console.warn("Failed to update payment session with orderId:", error);
        }

        // Store success info for the modal immediately so UI can read it
        try {
          sessionStorage.setItem(
            "orderSuccess",
            JSON.stringify({ orderId, paymentMethod, timestamp: Date.now() })
          );
        } catch (err) {
          console.warn("Failed to set orderSuccess in sessionStorage", err);
        }
      }

      // If we have created.order.items (array with productId), remove only matching cart items
      // Run cart synchronization in background to avoid blocking the mutation lifecycle
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

          (async () => {
            for (const it of toRemove) {
              try {
                await cartService.removeCartItem(
                  it.id,
                  userId,
                  resolvedStoreId
                );
              } catch (err) {
                // ignore per-item removal errors; we'll invalidate cache anyway
                console.warn("Failed to remove cart item", it.id, err);
              }
            }

            try {
              qc.invalidateQueries({
                queryKey: ["cart", userId, resolvedStoreId],
              });
              qc.invalidateQueries({
                queryKey: ["cart", "totals", userId, resolvedStoreId],
              });
            } catch (err) {
              console.warn("Failed to invalidate cart queries", err);
            }
          })();
        }
      } catch (err) {
        console.warn("Failed to sync cart after order creation", err);
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
      // Option: invalidate cart to refresh latest inventory state (only when storeId is known)
      if (typeof storeId === "number") {
        qc.invalidateQueries({ queryKey: ["cart", userId, storeId] });
        qc.invalidateQueries({ queryKey: ["cart", "totals", userId, storeId] });
      }
      // rethrow so callers (pages/components) can show toast once
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
          prev
            ? { ...prev, status: "CANCELLED" }
            : ({ id: orderId, status: "CANCELLED", items: [] } as OrderDetail)
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

// Hook: confirm an order (manual confirmation by user)
export function useConfirmOrder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (opts: { orderId: number; userId?: number }) => {
      const { orderId, userId } = opts;
      const res = await orderService.confirmOrder(orderId, userId);
      return res.data;
    },
    onSuccess: (_data, vars) => {
      const orderId = (vars as { orderId: number }).orderId;
      try {
        qc.setQueryData<OrderDetail | null>(["order", orderId], (prev) =>
          prev
            ? { ...prev, status: "CONFIRMED" }
            : ({ id: orderId, status: "CONFIRMED", items: [] } as OrderDetail)
        );
      } catch (err) {
        console.warn("Failed to set order cache after confirm", err);
      }

      try {
        qc.invalidateQueries({ queryKey: ["order", orderId] });
      } catch (err) {
        console.warn("Failed to invalidate order cache", err);
      }
    },
  });
}

// Types for list hook
export type OrdersFilter = {
  q?: string | number | undefined;
  date?: string | undefined; // single-date filter for simplicity
  status?: string | undefined;
};

// Hook: list orders with simple filters
export function useGetOrders(filters?: OrdersFilter, extraKey?: number) {
  const queryKey = React.useMemo(() => {
    return [
      "orders",
      filters?.q || null,
      filters?.status || null,
      filters?.date || null,
      extraKey || 0,
    ];
  }, [filters?.q, filters?.status, filters?.date, extraKey]);

  return useQuery<Array<OrderDetail>, Error>({
    queryKey,
    queryFn: async () => {
      const params: Record<string, unknown> = {};
      if (filters?.q) params.q = filters.q;
      if (filters?.status) params.status = filters.status;
      if (filters?.date) {
        // For date filtering, set dateFrom to start of day and dateTo to end of day
        const selectedDate = new Date(filters.date);
        const dateFrom = new Date(selectedDate);
        dateFrom.setHours(0, 0, 0, 0);

        const dateTo = new Date(selectedDate);
        dateTo.setHours(23, 59, 59, 999);

        params.dateFrom = dateFrom.toISOString();
        params.dateTo = dateTo.toISOString();
      }

      // Debug logging
      console.log("Order filter params:", params);
      console.log("Query key:", queryKey);

      const res = await orderService.list(params);
      console.log("Order service response:", res);

      const maybeBody = (res as ApiResponse<unknown>) || null;
      const payloadCandidate = maybeBody?.data ?? (res as unknown);
      const payloadObj = payloadCandidate as
        | { items?: Array<OrderDetail> }
        | Array<OrderDetail>
        | null;
      if (!payloadObj) return [];
      if (Array.isArray(payloadObj)) return payloadObj;
      return payloadObj.items ?? [];
    },
    retry: 1,
    staleTime: 0, // Always refetch when query key changes
    gcTime: 0, // Don't cache results
  });
}
