import { prisma } from "@repo/database";

/**
 * Data access layer for cart operations
 */
export class CartData {
  static readonly CART_INCLUDE = {
    items: {
      orderBy: { createdAt: "asc" as const },
      select: {
        id: true,
        productId: true,
        qty: true,
        unitPriceSnapshot: true,
        createdAt: true,
        updatedAt: true,
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            isActive: true,
          },
        },
      },
    },
  };

  static async getOrCreateCart(userId: number, storeId: number) {
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
  }

  static async getCartWithItems(userId: number, storeId: number) {
    return prisma.cart.findFirst({
      where: { userId, storeId },
      include: this.CART_INCLUDE,
    });
  }

  static async getCartWithTotals(userId: number, storeId: number) {
    return prisma.cart.findFirst({
      where: { userId, storeId },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  static async createCartItem(
    cartId: number,
    productId: number,
    qty: number,
    price: string
  ) {
    return prisma.cartItem.create({
      data: {
        cartId,
        productId,
        qty,
        unitPriceSnapshot: price,
      },
    });
  }

  static async updateCartItem(itemId: number, qty: number, price: string) {
    return prisma.cartItem.update({
      where: { id: itemId },
      data: { qty, unitPriceSnapshot: price },
    });
  }

  static async deleteCartItem(itemId: number) {
    return prisma.cartItem.delete({ where: { id: itemId } });
  }

  static async clearAllCartItems(cartId: number) {
    return prisma.cartItem.deleteMany({ where: { cartId } });
  }
}
