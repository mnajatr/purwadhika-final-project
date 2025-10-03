import { AddToCartSchema, UpdateCartItemSchema } from "@repo/schemas";
import { inventoryService } from "./inventory.service.js";
import { CartValidation, CartUtils, CartRepo } from "../lib/cart.helpers.js";

export class CartService {
  private inventoryService = inventoryService;

  async getCartByUserIdAndStoreId(userId: number, storeId: number) {
    CartValidation.validateUserId(userId);
    CartValidation.validateStoreId(storeId);

    const cart = await CartRepo.getCartWithItems(userId, storeId);
    return cart;
  }

  async addToCart(
    userId: number,
    productId: number,
    qty: number,
    storeId: number
  ) {
    const validatedData = AddToCartSchema.parse({
      userId,
      productId,
      qty,
      storeId,
    });

    const inventory = await this.inventoryService.checkCartStock(
      validatedData.storeId,
      validatedData.productId,
      validatedData.qty
    );

    const cart = await CartRepo.getOrCreateCart(
      validatedData.userId!,
      validatedData.storeId
    );

    CartValidation.validateCartItemLimits(
      cart.items,
      validatedData.qty,
      inventory
    );

    const existingItem = CartUtils.findExistingCartItem(
      cart.items,
      validatedData.productId
    );

    if (existingItem) {
      const newQty = existingItem.qty + validatedData.qty;
      CartValidation.validateCartItemLimits([], newQty, inventory);
      return this.updateCartItem(
        validatedData.userId!,
        existingItem.id,
        newQty,
        validatedData.storeId
      );
    }

    await CartRepo.createCartItem(
      cart.id,
      validatedData.productId,
      validatedData.qty
    );

    const updatedCart = await CartRepo.getCartWithItems(
      validatedData.userId!,
      validatedData.storeId
    );

    return updatedCart;
  }

  async updateCartItem(
    userId: number,
    itemId: number,
    qty: number,
    storeId: number
  ) {
    const validatedData = UpdateCartItemSchema.parse({
      userId,
      qty,
    });

    CartValidation.validateItemId(itemId);
    CartValidation.validateStoreId(storeId);

    const cartItem = await CartRepo.validateCartItem(userId, itemId, storeId);

    await this.inventoryService.checkCartStock(
      storeId,
      cartItem.productId,
      validatedData.qty
    );

    await CartRepo.updateCartItemRow(itemId, validatedData.qty);
    const updatedCart = await CartRepo.getCartWithItems(userId, storeId);

    return updatedCart;
  }

  async deleteCartItem(userId: number, itemId: number, storeId: number) {
    CartValidation.validateUserId(userId);
    CartValidation.validateItemId(itemId);
    CartValidation.validateStoreId(storeId);

    await CartRepo.validateCartItem(userId, itemId, storeId);
    await CartRepo.deleteCartItemRow(itemId);
    const updatedCart = await CartRepo.getCartWithItems(userId, storeId);

    return updatedCart;
  }

  async clearCart(userId: number, storeId: number) {
    CartValidation.validateUserId(userId);
    CartValidation.validateStoreId(storeId);

    const cart = await CartRepo.validateCart(userId, storeId);
    await CartRepo.clearAllCartItems(cart.id);
    const updatedCart = await CartRepo.getCartWithItems(userId, storeId);

    return updatedCart;
  }

  async getCartTotals(userId: number, storeId: number) {
    CartValidation.validateUserId(userId);
    CartValidation.validateStoreId(storeId);

    const cart = await CartRepo.getCartWithTotals(userId, storeId);

    if (!cart) {
      return {
        totalItems: 0,
        totalQuantity: 0,
        subtotal: 0,
        items: [],
      };
    }

    const totals = CartUtils.calculateCartTotals(cart.items);
    const items = CartUtils.mapCartItemsForTotals(cart.items);

    return {
      ...totals,
      items,
    };
  }
}

export const cartService = new CartService();
