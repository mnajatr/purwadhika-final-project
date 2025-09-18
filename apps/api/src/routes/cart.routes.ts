import { Router } from "express";
import { CartController } from "../controllers/cart.controller.js";
import {
  validateBody,
  validateParams,
} from "../middleware/validation.middleware.js";
import {
  AddToCartSchema,
  UpdateCartItemSchema,
  CartItemParamsSchema,
} from "@repo/schemas";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validateQuery } from "../middleware/validation.middleware.js";
import { UserQuerySchema } from "@repo/schemas";

const router = Router();
const cartController = new CartController();

// GET /cart
router.get(
  "/",
  authMiddleware,
  validateQuery(UserQuerySchema),
  cartController.getCart
);

// GET /cart/totals - Get cart totals
router.get(
  "/totals",
  authMiddleware,
  validateQuery(UserQuerySchema),
  cartController.getCartTotals
);

// POST /cart - Add item to cart
router.post(
  "/",
  authMiddleware,
  validateBody(AddToCartSchema),
  cartController.addToCart
);

// DELETE /cart - Clear entire cart
router.delete("/", authMiddleware, cartController.clearCart);

// PATCH /cart/:itemId - Update cart item quantity
router.patch(
  "/:itemId",
  authMiddleware,
  validateParams(CartItemParamsSchema),
  validateBody(UpdateCartItemSchema),
  cartController.updateCartItem
);

// DELETE /cart/:itemId - Remove item from cart
router.delete(
  "/:itemId",
  authMiddleware,
  validateParams(CartItemParamsSchema),
  cartController.deleteCartItem
);

export default router;
