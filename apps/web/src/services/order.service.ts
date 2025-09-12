import { apiClient } from "@/lib/axios-client";
import type { ApiResponse } from "@/types/api";

type OrderItem = { productId: number; qty: number };

export class OrderService {
  private base = "/orders";

  async createOrder(
    userId: number,
    storeId: number | undefined,
    items: OrderItem[],
    idempotencyKey?: string,
    userLat?: number,
    userLon?: number,
    addressId?: number
  ): Promise<ApiResponse<unknown>> {
    const body: Record<string, unknown> = { items, userId };
    if (typeof storeId === "number") body.storeId = storeId;
    if (idempotencyKey) body.idempotencyKey = idempotencyKey;
    if (typeof userLat === "number") body.userLat = userLat;
    if (typeof userLon === "number") body.userLon = userLon;
    if (typeof addressId === "number") body.addressId = addressId;
    return apiClient.post<ApiResponse<unknown>>(this.base, body);
  }

  async getOrder(id: number): Promise<ApiResponse<unknown>> {
    return apiClient.get<ApiResponse<unknown>>(`${this.base}/${id}`);
  }

  async cancelOrder(
    id: number,
    requesterUserId?: number
  ): Promise<ApiResponse<unknown>> {
    // backend exposes PATCH /orders/:id/cancel for manual cancellation
    // include requesterUserId in body for local dev fallback (controller will pick it up)
    const body: Record<string, unknown> = {};
    if (typeof requesterUserId === "number") body.userId = requesterUserId;
    return apiClient.patch<ApiResponse<unknown>>(
      `${this.base}/${id}/cancel`,
      body
    );
  }
}

export const orderService = new OrderService();
