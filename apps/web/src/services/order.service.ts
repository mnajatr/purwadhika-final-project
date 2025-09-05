import { apiClient } from "@/lib/axios-client";
import type { ApiResponse } from "@/types/api";

type OrderItem = { productId: number; qty: number };

export class OrderService {
  private base = "/orders";

  async createOrder(
    userId: number,
    storeId: number,
    items: OrderItem[],
    idempotencyKey?: string
  ): Promise<ApiResponse<unknown>> {
    const body: Record<string, unknown> = { items, storeId, userId };
    if (idempotencyKey) body.idempotencyKey = idempotencyKey;
    return apiClient.post<ApiResponse<unknown>>(this.base, body);
  }
}

export const orderService = new OrderService();
