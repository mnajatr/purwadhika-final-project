import { apiClient } from "../lib/api-client";
import { ApiResponse } from "../types/api";
import type {
  Cart,
  CartTotals,
  AddToCartRequest,
  UpdateCartItemRequest,
} from "../types/cart.types";

export class CartService {
  private readonly basePath = "/cart";

  async getCart(
    userId: number,
    storeId: number
  ): Promise<ApiResponse<Cart | null>> {
    const params = { userId: userId.toString(), storeId: storeId.toString() };
    return apiClient.get<ApiResponse<Cart | null>>(this.basePath, params);
  }

  async getCartTotals(
    userId: number,
    storeId: number
  ): Promise<ApiResponse<CartTotals>> {
    const params = { userId: userId.toString(), storeId: storeId.toString() };
    return apiClient.get<ApiResponse<CartTotals>>(
      `${this.basePath}/totals`,
      params
    );
  }

  async addToCart(data: AddToCartRequest): Promise<ApiResponse<Cart>> {
    return apiClient.post<ApiResponse<Cart>>(this.basePath, data);
  }

  async updateCartItem(
    itemId: number,
    data: UpdateCartItemRequest
  ): Promise<ApiResponse<Cart>> {
    return apiClient.patch<ApiResponse<Cart>>(
      `${this.basePath}/${itemId}`,
      data
    );
  }

  async removeCartItem(
    itemId: number,
    userId: number,
    storeId: number
  ): Promise<ApiResponse<Cart>> {
    return apiClient.delete<ApiResponse<Cart>>(`${this.basePath}/${itemId}`, {
      userId,
      storeId,
    });
  }

  async clearCart(userId: number, storeId: number): Promise<ApiResponse<Cart>> {
    return apiClient.delete<ApiResponse<Cart>>(this.basePath, {
      userId,
      storeId,
    });
  }
}

export const cartService = new CartService();
