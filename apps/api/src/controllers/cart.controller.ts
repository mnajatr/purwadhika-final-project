import { Request, Response } from "express";
import { CartService } from "../services/cart.service.js";
import { successResponse, errorResponse } from "../utils/helpers.js";

export class CartController {
  private cartService: CartService;

  constructor() {
    this.cartService = new CartService();
  }

  getCart = async (req: Request, res: Response) => {
    try {
      // TODO: Get userId from auth middleware when implemented
      const userId = parseInt((req.query.userId as string) || "1");
      const storeId = parseInt(
        (req.query.storeId as string) || req.body.storeId || "1"
      );
      const cart = await this.cartService.getCartByUserIdAndStoreId(
        userId,
        storeId
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
      const userId = req.body.userId || "user-1";
      const { productId, qty, storeId } = req.body;

      const cart = await this.cartService.addToCart(
        userId,
        productId,
        qty,
        storeId
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
      const userId = parseInt(req.body.userId) || 1;
      const itemId = parseInt(req.params.itemId);
      const { qty, storeId } = req.body;

      const cart = await this.cartService.updateCartItem(
        userId,
        itemId,
        qty,
        storeId
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
      const userId = parseInt(req.body.userId) || 1;
      const itemId = parseInt(req.params.itemId);
      const storeId = parseInt(req.body.storeId) || 1;

      const cart = await this.cartService.deleteCartItem(
        userId,
        itemId,
        storeId
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
      const userId = parseInt(req.body.userId) || 1;
      const storeId = parseInt(req.body.storeId) || 1;

      const cart = await this.cartService.clearCart(userId, storeId);

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
      const userId = parseInt((req.query.userId as string) || "1");
      const storeId = parseInt(
        (req.query.storeId as string) || req.body.storeId || "1"
      );

      const totals = await this.cartService.getCartTotals(userId, storeId);

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
