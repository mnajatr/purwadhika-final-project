import { prisma } from "@repo/database";
import { CART_CONSTANTS, ERROR_MESSAGES } from "../../utils/helpers.js";
import {
  createNotFoundError,
  createValidationError,
} from "../../errors/app.error.js";

/**
 * Validation logic for cart operations
 */
export class CartValidation {
  static validateQuantity(qty: number) {
    if (qty > CART_CONSTANTS.MAX_ITEM_QUANTITY) {
      throw createValidationError(ERROR_MESSAGES.CART.MAX_QUANTITY_EXCEEDED);
    }
  }

  static async validateProductAndInventory(
    productId: number,
    storeId: number,
    qty: number
  ) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw createNotFoundError("Product");
    if (!product.isActive)
      throw createValidationError(ERROR_MESSAGES.PRODUCT.NOT_AVAILABLE);

    const inventory = await prisma.storeInventory.findUnique({
      where: { storeId_productId: { storeId, productId } },
    });
    if (!inventory) throw createValidationError(ERROR_MESSAGES.PRODUCT.NOT_IN_STORE);
    if (inventory.stockQty < qty) {
      throw createValidationError(
        `${ERROR_MESSAGES.INVENTORY.INSUFFICIENT_STOCK}. Available: ${inventory.stockQty}`
      );
    }
    return inventory;
  }

  static async validateCartItem(
    userId: number,
    itemId: number,
    storeId: number
  ) {
    const cartItem = await prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId, storeId } },
      include: { product: true },
    });
    if (!cartItem) throw createNotFoundError("Cart item");
    return cartItem;
  }

  static async validateCart(userId: number, storeId: number) {
    const cart = await prisma.cart.findFirst({ where: { userId, storeId } });
    if (!cart) throw createNotFoundError("Cart");
    return cart;
  }

  static validateCartItemLimits(
    cartItems: any[],
    newQty: number,
    inventory: any
  ) {
    if (cartItems.length >= CART_CONSTANTS.MAX_CART_ITEMS) {
      throw createValidationError(ERROR_MESSAGES.CART.MAX_ITEMS_EXCEEDED);
    }

    if (newQty > CART_CONSTANTS.MAX_ITEM_QUANTITY) {
      throw createValidationError(ERROR_MESSAGES.CART.TOTAL_QUANTITY_EXCEEDED);
    }

    if (newQty > inventory.stockQty) {
      throw createValidationError(
        `Total quantity exceeds available stock: ${inventory.stockQty}`
      );
    }
  }
}
