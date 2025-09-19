import { Request, Response, NextFunction } from "express";
import { CartService } from "../services/cart.service.js";
import { successResponse, errorResponse } from "../utils/helpers.js";
import {
  createValidationError,
  createNotFoundError,
} from "../errors/app.error.js";

function toNumber(value: unknown, fallback?: number) {
  if (value === undefined || value === null) return fallback;
  const n = Number(value);
  return Number.isNaN(n) ? fallback : n;
}

export class CartController {
  private cartService: CartService;

  constructor() {
    this.cartService = new CartService();
  }

  // helper to read authenticated user id set by auth middleware
  private getUserIdFromReq(req: Request): number | undefined {
    // auth middleware attaches user: { id }
    const anyReq = req as Request & { user?: { id?: number } };
    return toNumber(anyReq.user?.id, undefined);
  }

  private getStoreIdFromReq(req: Request): number {
    return toNumber(req.query?.storeId, toNumber(req.body?.storeId, 1)) ?? 1;
  }

  private mapErrorStatus(error: unknown): number {
    const msg = error instanceof Error ? error.message : String(error);
    const lowered = msg.toLowerCase();
    if (
      lowered.includes("not found") ||
      lowered.includes("not available") ||
      lowered.includes("insufficient") ||
      lowered.includes("exceed") ||
      lowered.includes("cannot")
    ) {
      return 400;
    }
    return 500;
  }

  getCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserIdFromReq(req);
      const storeId = this.getStoreIdFromReq(req);

      if (!userId) {
        throw createValidationError("Missing userId in request");
      }

      const cart = await this.cartService.getCartByUserIdAndStoreId(
        userId!,
        storeId
      );

      res.json(successResponse(cart, "Cart retrieved successfully"));
    } catch (error) {
      next(error);
    }
  };

  addToCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserIdFromReq(req);
      const { productId, qty } = req.body;
      const storeId = this.getStoreIdFromReq(req);

      if (!userId) {
        throw createValidationError("Missing userId in request body");
      }
      if (!productId) {
        throw createValidationError("Missing productId in request body");
      }

      const cart = await this.cartService.addToCart(
        userId!,
        productId,
        qty,
        storeId
      );

      res.json(successResponse(cart, "Item added to cart successfully"));
    } catch (error) {
      next(error);
    }
  };

  updateCartItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserIdFromReq(req);
      const itemId = toNumber(req.params?.itemId, undefined);
      const { qty } = req.body;
      const storeId = this.getStoreIdFromReq(req);

      if (!userId)
        throw createValidationError("Missing userId in request body");
      if (!itemId) throw createValidationError("Missing itemId in params");
      if (typeof qty === "undefined")
        throw createValidationError("Missing qty in request body");

      const cart = await this.cartService.updateCartItem(
        userId!,
        itemId!,
        qty,
        storeId
      );

      res.json(successResponse(cart, "Cart item updated successfully"));
    } catch (error) {
      next(error);
    }
  };

  deleteCartItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserIdFromReq(req);
      const itemId = toNumber(req.params?.itemId, undefined);
      const storeId = this.getStoreIdFromReq(req);

      if (!userId)
        throw createValidationError("Missing userId in request body");
      if (!itemId) throw createValidationError("Missing itemId in params");

      const cart = await this.cartService.deleteCartItem(
        userId!,
        itemId!,
        storeId
      );

      res.json(successResponse(cart, "Item removed from cart successfully"));
    } catch (error) {
      next(error);
    }
  };

  clearCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserIdFromReq(req);
      const storeId = this.getStoreIdFromReq(req);

      if (!userId)
        throw createValidationError("Missing userId in request body");

      const cart = await this.cartService.clearCart(userId!, storeId);

      res.json(successResponse(cart, "Cart cleared successfully"));
    } catch (error) {
      next(error);
    }
  };

  getCartTotals = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserIdFromReq(req);
      const storeId = this.getStoreIdFromReq(req);

      if (!userId) throw createValidationError("Missing userId in query");

      const totals = await this.cartService.getCartTotals(userId!, storeId);

      res.json(successResponse(totals, "Cart totals retrieved successfully"));
    } catch (error) {
      next(error);
    }
  };
}
