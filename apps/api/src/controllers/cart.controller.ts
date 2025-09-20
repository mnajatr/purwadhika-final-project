import { Request, Response, NextFunction } from "express";
import { CartService } from "../services/cart.service.js";
import { successResponse } from "../utils/helpers.js";
import { createValidationError } from "../errors/app.error.js";

export class CartController {
  private cartService: CartService;

  constructor() {
    this.cartService = new CartService();
  }

  // helper to read authenticated user id set by auth middleware
  private getUserIdFromReq(req: Request): number {
    // auth middleware attaches user: { id }
    const anyReq = req as Request & { user?: { id?: number } };
    const userId = anyReq.user?.id;

    if (!userId) {
      throw createValidationError("Authentication required");
    }

    return userId;
  }

  private getStoreIdFromReq(req: Request): number {
    const storeId = req.query?.storeId || req.body?.storeId || 1;
    const parsedStoreId = Number(storeId);

    if (isNaN(parsedStoreId) || parsedStoreId <= 0) {
      throw createValidationError("Invalid store");
    }

    return parsedStoreId;
  }

  getCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserIdFromReq(req);
      const storeId = this.getStoreIdFromReq(req);

      const cart = await this.cartService.getCartByUserIdAndStoreId(
        userId,
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

      const cart = await this.cartService.addToCart(
        userId,
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
      const itemId = Number(req.params?.itemId);
      const { qty } = req.body;
      const storeId = this.getStoreIdFromReq(req);

      if (isNaN(itemId) || itemId <= 0) {
        throw createValidationError("Invalid item");
      }

      const cart = await this.cartService.updateCartItem(
        userId,
        itemId,
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
      const itemId = Number(req.params?.itemId);
      const storeId = this.getStoreIdFromReq(req);

      if (isNaN(itemId) || itemId <= 0) {
        throw createValidationError("Invalid item");
      }

      const cart = await this.cartService.deleteCartItem(
        userId,
        itemId,
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

      const cart = await this.cartService.clearCart(userId, storeId);

      res.json(successResponse(cart, "Cart cleared successfully"));
    } catch (error) {
      next(error);
    }
  };

  getCartTotals = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserIdFromReq(req);
      const storeId = this.getStoreIdFromReq(req);

      const totals = await this.cartService.getCartTotals(userId, storeId);

      res.json(successResponse(totals, "Cart totals retrieved successfully"));
    } catch (error) {
      next(error);
    }
  };
}
