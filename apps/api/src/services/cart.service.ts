import { prisma } from "@repo/database";
import { ERROR_MESSAGES, CART_CONSTANTS } from "../utils/helpers.js";
import {
  createValidationError,
  createNotFoundError,
} from "../errors/app.error.js";
import {
  AddToCartInput,
  UpdateCartItemInput,
  AddToCartSchema,
  UpdateCartItemSchema,
} from "@repo/schemas";

export class CartService {
  // Data helpers (merged from CartData)
  private static CART_INCLUDE = {
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
          },
        },
      },
    },
  };

  private async getOrCreateCart(userId: number, storeId: number) {
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

  private async getCartWithItems(userId: number, storeId: number) {
    const cart = await prisma.cart.findFirst({
      where: { userId, storeId },
      include: CartService.CART_INCLUDE,
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
  }

  private async getCartWithTotals(userId: number, storeId: number) {
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

  private async createCartItem(cartId: number, productId: number, qty: number) {
    return prisma.cartItem.create({ data: { cartId, productId, qty } });
  }

  private async updateCartItemRow(itemId: number, qty: number) {
    return prisma.cartItem.update({ where: { id: itemId }, data: { qty } });
  }

  private async deleteCartItemRow(itemId: number) {
    return prisma.cartItem.delete({ where: { id: itemId } });
  }

  private async clearAllCartItems(cartId: number) {
    return prisma.cartItem.deleteMany({ where: { cartId } });
  }

  // Business helpers (merged from CartBusiness)
  private findExistingCartItem(cartItems: any[], productId: number) {
    return cartItems.find((item: any) => item.productId === productId);
  }

  private calculateCartTotals(cartItems: any[]) {
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
  }

  private mapCartItemsForTotals(cartItems: any[]) {
    return cartItems.map((item: any) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      quantity: item.qty,
      unitPrice: Number(item.product?.price ?? 0),
      total: Number(item.product?.price ?? 0) * item.qty,
    }));
  }

  // Validation helpers (merged from CartValidation)
  private validateQuantity(qty: number) {
    if (qty > CART_CONSTANTS.MAX_ITEM_QUANTITY) {
      throw createValidationError(ERROR_MESSAGES.CART.MAX_QUANTITY_EXCEEDED);
    }
  }

  private async validateProductAndInventory(
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
    if (!inventory)
      throw createValidationError(ERROR_MESSAGES.PRODUCT.NOT_IN_STORE);
    if (inventory.stockQty < qty) {
      throw createValidationError(
        `${ERROR_MESSAGES.INVENTORY.INSUFFICIENT_STOCK}. Available: ${inventory.stockQty}`
      );
    }
    return inventory;
  }

  private async validateCartItem(
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

  private async validateCart(userId: number, storeId: number) {
    const cart = await prisma.cart.findFirst({ where: { userId, storeId } });
    if (!cart) throw createNotFoundError("Cart");
    return cart;
  }

  private validateCartItemLimits(
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

  // Public service API with input validation
  async getCartByUserIdAndStoreId(userId: number, storeId: number) {
    if (!userId || userId <= 0) {
      throw createValidationError("Invalid user");
    }
    if (!storeId || storeId <= 0) {
      throw createValidationError("Invalid store");
    }
    return this.getCartWithItems(userId, storeId);
  }

  async addToCart(
    userId: number,
    productId: number,
    qty: number,
    storeId: number
  ) {
    // Validate input using Zod schema
    const validatedData = AddToCartSchema.parse({
      userId,
      productId,
      qty,
      storeId,
    });

    const inventory = await this.validateProductAndInventory(
      validatedData.productId,
      validatedData.storeId,
      validatedData.qty
    );
    const cart = await this.getOrCreateCart(
      validatedData.userId!,
      validatedData.storeId
    );

    this.validateCartItemLimits(cart.items, validatedData.qty, inventory);

    const existingItem = this.findExistingCartItem(
      cart.items,
      validatedData.productId
    );
    if (existingItem) {
      const newQty = existingItem.qty + validatedData.qty;
      this.validateCartItemLimits([], newQty, inventory);
      return this.updateCartItem(
        validatedData.userId!,
        existingItem.id,
        newQty,
        validatedData.storeId
      );
    }

    await this.createCartItem(
      cart.id,
      validatedData.productId,
      validatedData.qty
    );
    return this.getCartByUserIdAndStoreId(
      validatedData.userId!,
      validatedData.storeId
    );
  }

  async updateCartItem(
    userId: number,
    itemId: number,
    qty: number,
    storeId: number
  ) {
    // Validate input using Zod schema
    const validatedData = UpdateCartItemSchema.parse({
      userId,
      qty,
    });

    if (!itemId || itemId <= 0) {
      throw createValidationError("Invalid item");
    }
    if (!storeId || storeId <= 0) {
      throw createValidationError("Invalid store");
    }

    const cartItem = await this.validateCartItem(userId, itemId, storeId);

    const inventory = await prisma.storeInventory.findFirst({
      where: { productId: cartItem.productId, storeId: storeId },
    });
    if (!inventory) {
      throw createValidationError(ERROR_MESSAGES.INVENTORY.NO_INVENTORY);
    }
    if (inventory.stockQty < validatedData.qty) {
      throw createValidationError(
        `${ERROR_MESSAGES.INVENTORY.INSUFFICIENT_STOCK}. Available: ${inventory.stockQty}`
      );
    }

    await this.updateCartItemRow(itemId, validatedData.qty);
    return this.getCartByUserIdAndStoreId(userId, storeId);
  }

  async deleteCartItem(userId: number, itemId: number, storeId: number) {
    if (!userId || userId <= 0) {
      throw createValidationError("Invalid user");
    }
    if (!itemId || itemId <= 0) {
      throw createValidationError("Invalid item");
    }
    if (!storeId || storeId <= 0) {
      throw createValidationError("Invalid store");
    }

    await this.validateCartItem(userId, itemId, storeId);
    await this.deleteCartItemRow(itemId);
    return this.getCartByUserIdAndStoreId(userId, storeId);
  }

  async clearCart(userId: number, storeId: number) {
    if (!userId || userId <= 0) {
      throw createValidationError("Invalid user");
    }
    if (!storeId || storeId <= 0) {
      throw createValidationError("Invalid store");
    }

    const cart = await this.validateCart(userId, storeId);
    await this.clearAllCartItems(cart.id);
    return this.getCartByUserIdAndStoreId(userId, storeId);
  }

  async getCartTotals(userId: number, storeId: number) {
    if (!userId || userId <= 0) {
      throw createValidationError("Invalid user");
    }
    if (!storeId || storeId <= 0) {
      throw createValidationError("Invalid store");
    }

    const cart = await this.getCartWithTotals(userId, storeId);

    if (!cart) {
      return { totalItems: 0, totalQuantity: 0, subtotal: 0, items: [] };
    }

    const totals = this.calculateCartTotals(cart.items);
    const items = this.mapCartItemsForTotals(cart.items);

    return {
      ...totals,
      items,
    };
  }
}
