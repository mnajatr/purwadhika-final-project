import { apiClient } from "../lib/axios-client";
import { ApiResponse } from "../types/api";
import {
  CartResponse as Cart,
  CartTotals,
  AddToCartInput,
  UpdateCartItemInput,
  AddToCartSchema,
  UpdateCartItemSchema,
} from "@repo/schemas";

export class CartService {
  private readonly basePath = "/cart";

  async getCart(userId: number, storeId?: number): Promise<ApiResponse<Cart | null>> {
    // Validate inputs
    if (!userId || userId <= 0) {
      throw new Error("Invalid user");
    }

    const params: Record<string, string> = { userId: userId.toString() };
    if (storeId && storeId > 0) params.storeId = storeId.toString();
    return apiClient.get<ApiResponse<Cart | null>>(this.basePath, params);
  }

  async getCartTotals(userId: number, storeId?: number): Promise<ApiResponse<CartTotals>> {
    // Validate inputs
    if (!userId || userId <= 0) {
      throw new Error("Invalid user");
    }

    const params: Record<string, string> = { userId: userId.toString() };
    if (storeId && storeId > 0) params.storeId = storeId.toString();
    return apiClient.get<ApiResponse<CartTotals>>(`${this.basePath}/totals`, params);
  }

  async addToCart(data: AddToCartInput): Promise<ApiResponse<Cart>> {
    // Validate data using Zod schema
    const validatedData = AddToCartSchema.parse(data);
    return apiClient.post<ApiResponse<Cart>>(this.basePath, validatedData);
  }

  async updateCartItem(
    itemId: number,
    data: UpdateCartItemInput,
    storeId?: number
  ): Promise<ApiResponse<Cart>> {
    // Validate inputs
    if (!itemId || itemId <= 0) {
      throw new Error("Invalid item");
    }

    // Validate data using Zod schema
    const validatedData = UpdateCartItemSchema.parse(data);
    const url =
      storeId && storeId > 0
        ? `${this.basePath}/${itemId}?storeId=${storeId}`
        : `${this.basePath}/${itemId}`;
    return apiClient.patch<ApiResponse<Cart>>(url, validatedData);
  }

  async removeCartItem(itemId: number, userId: number, storeId?: number): Promise<ApiResponse<Cart>> {
    // Validate inputs
    if (!itemId || itemId <= 0) {
      throw new Error("Invalid item");
    }
    if (!userId || userId <= 0) {
      throw new Error("Invalid user");
    }
    if (!storeId || storeId <= 0) {
      throw new Error("Invalid store");
    }

    return apiClient.delete<ApiResponse<Cart>>(`${this.basePath}/${itemId}`, {
      userId,
      storeId,
    });
  }

  async clearCart(userId: number, storeId?: number): Promise<ApiResponse<Cart>> {
    // Validate inputs
    if (!userId || userId <= 0) {
      throw new Error("Invalid user");
    }
    if (!storeId || storeId <= 0) {
      throw new Error("Invalid store");
    }

    return apiClient.delete<ApiResponse<Cart>>(this.basePath, {
      userId,
      storeId,
    });
  }
}

export const cartService = new CartService();
