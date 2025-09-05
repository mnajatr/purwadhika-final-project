import { prisma } from "@repo/database";
import { ERROR_MESSAGES } from "../utils/helpers.js";
import { CartData, CartBusiness, CartValidation } from "../lib/cart/index.js";

export class CartService {
  async getCartByUserIdAndStoreId(userId: number, storeId: number) {
    return CartData.getCartWithItems(userId, storeId);
  }

  async addToCart(
    userId: number,
    productId: number,
    qty: number,
    storeId: number
  ) {
    CartValidation.validateQuantity(qty);
    const inventory = await CartValidation.validateProductAndInventory(
      productId,
      storeId,
      qty
    );
    const cart = await CartData.getOrCreateCart(userId, storeId);

    CartValidation.validateCartItemLimits(cart.items, qty, inventory);

    const existingItem = CartBusiness.findExistingCartItem(
      cart.items,
      productId
    );
    if (existingItem) {
      const newQty = existingItem.qty + qty;
      CartValidation.validateCartItemLimits([], newQty, inventory);
      return this.updateCartItem(userId, existingItem.id, newQty, storeId);
    }

    await CartData.createCartItem(cart.id, productId, qty);
    return this.getCartByUserIdAndStoreId(userId, storeId);
  }

  async updateCartItem(
    userId: number,
    itemId: number,
    qty: number,
    storeId: number
  ) {
    CartValidation.validateQuantity(qty);
    const cartItem = await CartValidation.validateCartItem(
      userId,
      itemId,
      storeId
    );

    const inventory = await prisma.storeInventory.findFirst({
      where: { productId: cartItem.productId, storeId: storeId },
    });
    if (!inventory) throw new Error(ERROR_MESSAGES.INVENTORY.NO_INVENTORY);
    if (inventory.stockQty < qty) {
      throw new Error(
        `${ERROR_MESSAGES.INVENTORY.INSUFFICIENT_STOCK}. Available: ${inventory.stockQty}`
      );
    }

    await CartData.updateCartItem(itemId, qty);
    return this.getCartByUserIdAndStoreId(userId, storeId);
  }

  async deleteCartItem(userId: number, itemId: number, storeId: number) {
    await CartValidation.validateCartItem(userId, itemId, storeId);
    await CartData.deleteCartItem(itemId);
    return this.getCartByUserIdAndStoreId(userId, storeId);
  }

  async clearCart(userId: number, storeId: number) {
    const cart = await CartValidation.validateCart(userId, storeId);
    await CartData.clearAllCartItems(cart.id);
    return this.getCartByUserIdAndStoreId(userId, storeId);
  }

  async getCartTotals(userId: number, storeId: number) {
    const cart = await CartData.getCartWithTotals(userId, storeId);

    if (!cart) {
      return { totalItems: 0, totalQuantity: 0, subtotal: 0, items: [] };
    }

    const totals = CartBusiness.calculateCartTotals(cart.items);
    const items = CartBusiness.mapCartItemsForTotals(cart.items);

    return {
      ...totals,
      items,
    };
  }
}
