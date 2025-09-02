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
    const cart = await prisma.cart.findFirst({
      where: { userId, storeId },
      include: this.CART_INCLUDE,
    });
    if (!cart) return null;
    // Mapping manual stockQty ke setiap item
    const itemsWithStock = await Promise.all(
      cart.items.map(async (item) => {
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
