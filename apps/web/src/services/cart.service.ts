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

  // Get user's cart
  async getCart(
    userId: number,
    storeId: number
  ): Promise<ApiResponse<Cart | null>> {
    const params = { userId: userId.toString(), storeId: storeId.toString() };
    return apiClient.get<ApiResponse<Cart | null>>(this.basePath, params);
  }

  // Get cart totals
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

  // Add item to cart
  async addToCart(data: AddToCartRequest): Promise<ApiResponse<Cart>> {
    return apiClient.post<ApiResponse<Cart>>(this.basePath, data);
  }

  // Update cart item quantity
  async updateCartItem(
    itemId: number,
    data: UpdateCartItemRequest
  ): Promise<ApiResponse<Cart>> {
    return apiClient.patch<ApiResponse<Cart>>(
      `${this.basePath}/${itemId}`,
      data
    );
  }

  // Remove item from cart
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

  // Clear entire cart
  async clearCart(userId: number, storeId: number): Promise<ApiResponse<Cart>> {
    return apiClient.delete<ApiResponse<Cart>>(this.basePath, {
      userId,
      storeId,
    });
  }
}

// Export singleton instance
export const cartService = new CartService();
