import { Request, Response } from "express";
import { CartService } from "../services/cart.service.js";
import { successResponse, errorResponse } from "../utils/helpers.js";

function toNumber(value: unknown, fallback?: number) {
  if (value === undefined || value === null) return fallback;
  const n = Number(value);
  return Number.isNaN(n) ? fallback : n;
}

function pickStoreId(req: Request) {
  // prefer query, then body, then default to 1
  // TODO: Clean the comment
  return toNumber(req.query?.storeId, toNumber(req.body?.storeId, 1)) ?? 1;
}

function handleError(
  res: Response,
  baseMessage: string,
  err: unknown,
  badKeywords: string[] = [
    "not found",
    "not available",
    "Insufficient",
    "exceed",
    "cannot",
  ]
) {
  const msg = err instanceof Error ? err.message : "Unknown error";
  const isBadRequest = badKeywords.some((k) => msg.includes(k));
  const status = isBadRequest ? 400 : 500;
  return res.status(status).json(errorResponse(baseMessage, msg));
}

export class CartController {
  private cartService = new CartService();

  getCart = async (req: Request, res: Response) => {
    try {
      // TODO: Get userId from auth middleware when implemented
      const userId = toNumber(req.query?.userId, undefined);
      if (!userId)
        return res.status(400).json(errorResponse("Missing userId in request"));

      const storeId = pickStoreId(req);
      const cart = await this.cartService.getCartByUserIdAndStoreId(
        userId,
        storeId
      );
      return res.json(successResponse(cart, "Cart retrieved successfully"));
    } catch (e) {
      return handleError(res, "Error getting cart", e, []);
    }
  };

  addToCart = async (req: Request, res: Response) => {
    try {
      // TODO: Get userId from auth middleware when implemented
      const userId = toNumber(req.body?.userId, undefined);
      const productId = req.body?.productId;
      const qty = req.body?.qty;
      const storeId = pickStoreId(req);

      if (!userId)
        return res
          .status(400)
          .json(errorResponse("Missing userId in request body"));
      if (!productId)
        return res
          .status(400)
          .json(errorResponse("Missing productId in request body"));

      const cart = await this.cartService.addToCart(
        userId,
        productId,
        qty,
        storeId
      );
      return res.json(successResponse(cart, "Item added to cart successfully"));
    } catch (e) {
      return handleError(res, "Failed to add item to cart", e);
    }
  };

  updateCartItem = async (req: Request, res: Response) => {
    try {
      // TODO: Get userId from auth middleware when implemented
      const userId = toNumber(req.body?.userId, undefined);
      const itemId = toNumber(req.params?.itemId, undefined);
      const qty = req.body?.qty;
      const storeId = pickStoreId(req);

      if (!userId)
        return res
          .status(400)
          .json(errorResponse("Missing userId in request body"));
      if (!itemId)
        return res.status(400).json(errorResponse("Missing itemId in params"));
      if (typeof qty === "undefined")
        return res
          .status(400)
          .json(errorResponse("Missing qty in request body"));

      const cart = await this.cartService.updateCartItem(
        userId,
        itemId,
        qty,
        storeId
      );
      return res.json(successResponse(cart, "Cart item updated successfully"));
    } catch (e) {
      return handleError(res, "Failed to update cart item", e);
    }
  };

  deleteCartItem = async (req: Request, res: Response) => {
    try {
      // TODO: Get userId from auth middleware when implemented
      const userId = toNumber(req.body?.userId, undefined);
      const itemId = toNumber(req.params?.itemId, undefined);
      const storeId = pickStoreId(req);

      if (!userId)
        return res
          .status(400)
          .json(errorResponse("Missing userId in request body"));
      if (!itemId)
        return res.status(400).json(errorResponse("Missing itemId in params"));

      const cart = await this.cartService.deleteCartItem(
        userId,
        itemId,
        storeId
      );
      return res.json(
        successResponse(cart, "Item removed from cart successfully")
      );
    } catch (e) {
      return handleError(res, "Failed to remove cart item", e, ["not found"]);
    }
  };

  clearCart = async (req: Request, res: Response) => {
    try {
      // TODO: Get userId from auth middleware when implemented
      const userId = toNumber(req.body?.userId, undefined);
      const storeId = pickStoreId(req);
      if (!userId)
        return res
          .status(400)
          .json(errorResponse("Missing userId in request body"));

      const cart = await this.cartService.clearCart(userId, storeId);
      return res.json(successResponse(cart, "Cart cleared successfully"));
    } catch (e) {
      return handleError(res, "Failed to clear cart", e, ["not found"]);
    }
  };

  getCartTotals = async (req: Request, res: Response) => {
    try {
      // TODO: Get userId from auth middleware when implemented
      const userId = toNumber(req.query?.userId, undefined);
      if (!userId)
        return res.status(400).json(errorResponse("Missing userId in query"));

      const storeId = pickStoreId(req);
      const totals = await this.cartService.getCartTotals(userId, storeId);
      return res.json(
        successResponse(totals, "Cart totals retrieved successfully")
      );
    } catch (e) {
      return handleError(res, "Failed to get cart totals", e);
    }
  };
}
