import { Request, Response, NextFunction } from "express";
import { cartService } from "../services/cart.service.js";
import { successResponse } from "../utils/helpers.js";
import { createValidationError } from "../errors/app.error.js";

export class CartController {
  private getUserIdFromReq(req: Request): number {
    const anyReq = req as Request & { user?: { id?: number } };

    // First try authenticated user
    if (anyReq.user?.id) {
      return anyReq.user.id;
    }

    // In non-production, allow dev headers/query params for testing
    if (process.env.NODE_ENV !== "production") {
      const headerUserId = req.headers["x-dev-user-id"];
      if (headerUserId) {
        const parsed = Number(headerUserId);
        if (!isNaN(parsed)) return parsed;
      }

      const queryUserId = req.query?.userId || req.body?.userId;
      if (queryUserId) {
        const parsed = Number(queryUserId);
        if (!isNaN(parsed)) return parsed;
      }
    }

    // If no userId found, throw authentication error
    throw createValidationError("Authentication required");
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

      const cart = await cartService.getCartByUserIdAndStoreId(userId, storeId);

      res
        .status(200)
        .json(successResponse(cart, "Cart retrieved successfully"));
    } catch (error) {
      next(error);
    }
  };

  addToCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserIdFromReq(req);
      const { productId, qty } = req.body;
      const storeId = this.getStoreIdFromReq(req);

      const cart = await cartService.addToCart(userId, productId, qty, storeId);

      res
        .status(200)
        .json(successResponse(cart, "Item added to cart successfully"));
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

      const cart = await cartService.updateCartItem(
        userId,
        itemId,
        qty,
        storeId
      );

      res
        .status(200)
        .json(successResponse(cart, "Cart item updated successfully"));
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

      const cart = await cartService.deleteCartItem(userId, itemId, storeId);

      res
        .status(200)
        .json(successResponse(cart, "Item removed from cart successfully"));
    } catch (error) {
      next(error);
    }
  };

  clearCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserIdFromReq(req);
      const storeId = this.getStoreIdFromReq(req);

      const cart = await cartService.clearCart(userId, storeId);

      res.status(200).json(successResponse(cart, "Cart cleared successfully"));
    } catch (error) {
      next(error);
    }
  };

  getCartTotals = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserIdFromReq(req);
      const storeId = this.getStoreIdFromReq(req);

      const totals = await cartService.getCartTotals(userId, storeId);

      res
        .status(200)
        .json(successResponse(totals, "Cart totals retrieved successfully"));
    } catch (error) {
      next(error);
    }
  };
}

export const cartController = new CartController();
