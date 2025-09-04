import { Request, Response } from "express";
import { CartService } from "../services/cart.service.js";
import { successResponse, errorResponse } from "../utils/helpers.js";

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

  getCart = async (req: Request, res: Response) => {
    try {
      // TODO: Get userId from auth middleware when implemented
      const userId = toNumber(req.query?.userId, undefined);
      const storeId = toNumber(
        req.query?.storeId,
        toNumber(req.body?.storeId, 1)
      );

      if (!userId) {
        return res.status(400).json(errorResponse("Missing userId in request"));
      }
      const cart = await this.cartService.getCartByUserIdAndStoreId(
        userId!,
        storeId ?? 1
      );

      const response = successResponse(cart, "Cart retrieved successfully");
      res.json(response);
    } catch (error) {
      const response = errorResponse(
        "Error getting cart",
        error instanceof Error ? error.message : "Unknown error"
      );
      res.status(500).json(response);
    }
  };

  addToCart = async (req: Request, res: Response) => {
    try {
      // TODO: Get userId from auth middleware when implemented
      const userId = toNumber(req.body?.userId, undefined);
      const { productId, qty } = req.body;
      const storeId = toNumber(req.body?.storeId, 1);

      if (!userId) {
        return res
          .status(400)
          .json(errorResponse("Missing userId in request body"));
      }
      if (!productId) {
        return res
          .status(400)
          .json(errorResponse("Missing productId in request body"));
      }

      const cart = await this.cartService.addToCart(
        userId!,
        productId,
        qty,
        storeId ?? 1
      );

      const response = successResponse(cart, "Item added to cart successfully");
      res.json(response);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const statusCode =
        errorMessage.includes("not found") ||
        errorMessage.includes("not available") ||
        errorMessage.includes("Insufficient") ||
        errorMessage.includes("exceed") ||
        errorMessage.includes("cannot")
          ? 400
          : 500;

      const response = errorResponse(
        "Failed to add item to cart",
        errorMessage
      );
      res.status(statusCode).json(response);
    }
  };

  updateCartItem = async (req: Request, res: Response) => {
    try {
      // TODO: Get userId from auth middleware when implemented
      const userId = toNumber(req.body?.userId, undefined);
      const itemId = toNumber(req.params?.itemId, undefined);
      const { qty } = req.body;
      const storeId = toNumber(req.body?.storeId, 1);

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
        userId!,
        itemId!,
        qty,
        storeId ?? 1
      );

      const response = successResponse(cart, "Cart item updated successfully");
      res.json(response);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const statusCode =
        errorMessage.includes("not found") ||
        errorMessage.includes("Insufficient") ||
        errorMessage.includes("exceed") ||
        errorMessage.includes("cannot")
          ? 400
          : 500;

      const response = errorResponse(
        "Failed to update cart item",
        errorMessage
      );
      res.status(statusCode).json(response);
    }
  };

  deleteCartItem = async (req: Request, res: Response) => {
    try {
      // TODO: Get userId from auth middleware when implemented
      const userId = toNumber(req.body?.userId, undefined);
      const itemId = toNumber(req.params?.itemId, undefined);
      const storeId = toNumber(req.body?.storeId, 1);

      if (!userId)
        return res
          .status(400)
          .json(errorResponse("Missing userId in request body"));
      if (!itemId)
        return res.status(400).json(errorResponse("Missing itemId in params"));

      const cart = await this.cartService.deleteCartItem(
        userId!,
        itemId!,
        storeId ?? 1
      );

      const response = successResponse(
        cart,
        "Item removed from cart successfully"
      );
      res.json(response);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const statusCode = errorMessage.includes("not found") ? 400 : 500;

      const response = errorResponse(
        "Failed to remove cart item",
        errorMessage
      );
      res.status(statusCode).json(response);
    }
  };

  clearCart = async (req: Request, res: Response) => {
    try {
      // TODO: Get userId from auth middleware when implemented
      const userId = toNumber(req.body?.userId, undefined);
      const storeId = toNumber(req.body?.storeId, 1);

      if (!userId)
        return res
          .status(400)
          .json(errorResponse("Missing userId in request body"));

      const cart = await this.cartService.clearCart(userId!, storeId ?? 1);

      const response = successResponse(cart, "Cart cleared successfully");
      res.json(response);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const statusCode = errorMessage.includes("not found") ? 400 : 500;

      const response = errorResponse("Failed to clear cart", errorMessage);
      res.status(statusCode).json(response);
    }
  };

  getCartTotals = async (req: Request, res: Response) => {
    try {
      // TODO: Get userId from auth middleware when implemented
      const userId = toNumber(req.query?.userId, undefined);
      const storeId = toNumber(
        req.query?.storeId,
        toNumber(req.body?.storeId, 1)
      );

      if (!userId) {
        return res.status(400).json(errorResponse("Missing userId in query"));
      }

      const totals = await this.cartService.getCartTotals(
        userId!,
        storeId ?? 1
      );

      const response = successResponse(
        totals,
        "Cart totals retrieved successfully"
      );
      res.json(response);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      const response = errorResponse("Failed to get cart totals", errorMessage);
      res.status(500).json(response);
    }
  };
}
