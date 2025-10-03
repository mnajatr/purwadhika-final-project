import { Request, Response, NextFunction } from "express";
import { cartService } from "../services/cart.service.js";
import {
  createValidationError,
  createUnauthorizedError,
} from "../errors/app.error.js";

export class CartController {
  private cartService = cartService;

  private getUserIdFromReq(req: Request): number {
    const anyReq = req as Request & { user?: { id?: number } };

    if (anyReq.user?.id) {
      return anyReq.user.id;
    }

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

    throw createUnauthorizedError("Authentication required");
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

      res.status(200).json({
        message: "Cart retrieved successfully",
        data: cart,
      });
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

      res.status(200).json({
        message: "Item added to cart successfully",
        data: cart,
      });
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

      res.status(200).json({
        message: "Cart item updated successfully",
        data: cart,
      });
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

      res.status(200).json({
        message: "Item removed from cart successfully",
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  };

  clearCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserIdFromReq(req);
      const storeId = this.getStoreIdFromReq(req);

      const cart = await this.cartService.clearCart(userId, storeId);

      res.status(200).json({
        message: "Cart cleared successfully",
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  };

  getCartTotals = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserIdFromReq(req);
      const storeId = this.getStoreIdFromReq(req);

      const totals = await this.cartService.getCartTotals(userId, storeId);

      res.status(200).json({
        message: "Cart totals retrieved successfully",
        data: totals,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const cartController = new CartController();
