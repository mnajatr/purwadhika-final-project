import { prisma } from "@repo/database";
import { ERROR_MESSAGES, CART_CONSTANTS } from "../utils/helpers.js";
import {
  createValidationError,
  createNotFoundError,
} from "../errors/app.error.js";

export const CART_INCLUDE = {
  items: {
    orderBy: { createdAt: "asc" as const },
    select: {
      id: true,
      productId: true,
      qty: true,
      createdAt: true,
      updatedAt: true,
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          price: true,
          isActive: true,
          images: {
            select: {
              id: true,
              imageUrl: true,
            },
            take: 1,
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  },
};

export const CartValidation = {
  validateUserId(userId: number) {
    if (!userId || userId <= 0) {
      throw createValidationError("Invalid user");
    }
  },

  validateStoreId(storeId: number) {
    if (!storeId || storeId <= 0) {
      throw createValidationError("Invalid store");
    }
  },

  validateItemId(itemId: number) {
    if (!itemId || itemId <= 0) {
      throw createValidationError("Invalid item");
    }
  },

  validateQuantity(qty: number) {
    if (qty > CART_CONSTANTS.MAX_ITEM_QUANTITY) {
      throw createValidationError(ERROR_MESSAGES.CART.MAX_QUANTITY_EXCEEDED);
    }
  },

  validateCartItemLimits(cartItems: any[], newQty: number, inventory: any) {
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
  },
};

export const CartUtils = {
  findExistingCartItem(cartItems: any[], productId: number) {
    return cartItems.find((item: any) => item.productId === productId);
  },

  calculateCartTotals(cartItems: any[]) {
    const totalItems = cartItems.length;
    const totalQuantity = cartItems.reduce(
      (sum: number, item: any) => sum + item.qty,
      0
    );
    const subtotal = cartItems.reduce(
      (sum: number, item: any) =>
        sum + Number(item.product?.price ?? 0) * item.qty,
      0
    );

    return { totalItems, totalQuantity, subtotal };
  },

  mapCartItemsForTotals(cartItems: any[]) {
    return cartItems.map((item: any) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      quantity: item.qty,
      unitPrice: Number(item.product?.price ?? 0),
      total: Number(item.product?.price ?? 0) * item.qty,
    }));
  },
};

export const CartRepo = {
  async getOrCreateCart(userId: number, storeId: number) {
    let cart = await prisma.cart.findFirst({
      where: { userId, storeId },
      include: { items: true },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId, storeId },
        include: { items: true },
      });
    }

    return cart;
  },

  async getCartWithItems(userId: number, storeId: number) {
    const cart = await prisma.cart.findFirst({
      where: { userId, storeId },
      include: CART_INCLUDE,
    });

    if (!cart) return null;

    const itemsWithStock = await Promise.all(
      cart.items.map(async (item: any) => {
        const inventory = await prisma.storeInventory.findFirst({
          where: { productId: item.productId, storeId },
          select: { stockQty: true },
        });
        return {
          ...item,
          storeInventory: { stockQty: inventory?.stockQty ?? 0 },
        };
      })
    );

    return { ...cart, items: itemsWithStock };
  },

  async getCartWithTotals(userId: number, storeId: number) {
    return prisma.cart.findFirst({
      where: { userId, storeId },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, price: true } },
          },
        },
      },
    });
  },

  async validateCartItem(userId: number, itemId: number, storeId: number) {
    const cartItem = await prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId, storeId } },
      include: { product: true },
    });

    if (!cartItem) {
      throw createNotFoundError("Cart item");
    }

    return cartItem;
  },

  async validateCart(userId: number, storeId: number) {
    const cart = await prisma.cart.findFirst({ where: { userId, storeId } });

    if (!cart) {
      throw createNotFoundError("Cart");
    }

    return cart;
  },

  async createCartItem(cartId: number, productId: number, qty: number) {
    return prisma.cartItem.create({
      data: { cartId, productId, qty },
    });
  },

  async updateCartItemRow(itemId: number, qty: number) {
    return prisma.cartItem.update({
      where: { id: itemId },
      data: { qty },
    });
  },

  async deleteCartItemRow(itemId: number) {
    return prisma.cartItem.delete({
      where: { id: itemId },
    });
  },

  async clearAllCartItems(cartId: number) {
    return prisma.cartItem.deleteMany({
      where: { cartId },
    });
  },
};
