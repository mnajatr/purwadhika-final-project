import { apiClient } from "@/lib/axios-client";
import type { ApiResponse } from "@/types/api";
import {
  CreateOrderItemSchema,
  OrderDetailSchema,
  OrdersFilterSchema,
  type CreateOrderItem,
  type OrderDetail,
  type OrdersFilter,
} from "@repo/schemas";

export class OrderService {
  private base = "/orders";

  async createOrder(
    userId: number,
    storeId: number | undefined,
    items: CreateOrderItem[],
    idempotencyKey?: string,
    userLat?: number,
    userLon?: number,
    addressId?: number,
    paymentMethod?: string,
    shippingMethod?: string,
    shippingOption?: string
  ): Promise<ApiResponse<OrderDetail>> {
    const validatedItems = items.map((item) =>
      CreateOrderItemSchema.parse(item)
    );

    const body: Record<string, unknown> = {
      items: validatedItems,
      userId,
    };
    if (typeof storeId === "number") body.storeId = storeId;
    if (idempotencyKey) body.idempotencyKey = idempotencyKey;
    if (typeof userLat === "number") body.userLat = userLat;
    if (typeof userLon === "number") body.userLon = userLon;
    if (typeof addressId === "number") body.addressId = addressId;
    if (paymentMethod) body.paymentMethod = paymentMethod;
    if (shippingMethod) body.shippingMethod = shippingMethod;
    if (shippingOption) body.shippingOption = shippingOption;
    
    const response = await apiClient.post<ApiResponse<OrderDetail>>(
      this.base,
      body
    );
    
    return response;
  }

  async getOrder(id: number): Promise<ApiResponse<OrderDetail>> {
    const response = await apiClient.get<ApiResponse<OrderDetail>>(
      `${this.base}/${id}`
    );
    
    if (response.data) {
      const parsed = OrderDetailSchema.safeParse(response.data);
      if (parsed.success) {
        return { ...response, data: parsed.data };
      }
    }
    
    return response;
  }

  async list(params?: OrdersFilter): Promise<ApiResponse<unknown>> {
    const validatedParams = params
      ? OrdersFilterSchema.partial().parse(params)
      : undefined;
    
    return apiClient.get<ApiResponse<unknown>>(this.base, {
      params: validatedParams,
    });
  }

  async cancelOrder(
    id: number,
    requesterUserId?: number
  ): Promise<ApiResponse<OrderDetail>> {
    const body: Record<string, unknown> = {};
    if (typeof requesterUserId === "number") body.userId = requesterUserId;
    
    return apiClient.patch<ApiResponse<OrderDetail>>(
      `${this.base}/${id}/cancel`,
      body
    );
  }

  async confirmOrder(
    id: number,
    requesterUserId?: number
  ): Promise<ApiResponse<OrderDetail>> {
    const body: Record<string, unknown> = {};
    if (typeof requesterUserId === "number") body.userId = requesterUserId;
    
    return apiClient.patch<ApiResponse<OrderDetail>>(
      `${this.base}/${id}/confirm`,
      body
    );
  }

  async shipOrder(
    id: number,
    actorUserId?: number
  ): Promise<ApiResponse<OrderDetail>> {
    const body: Record<string, unknown> = {};
    if (typeof actorUserId === "number") body.userId = actorUserId;
    
    return apiClient.patch<ApiResponse<OrderDetail>>(
      `${this.base}/${id}/ship`,
      body
    );
  }
}

export const orderService = new OrderService();

