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

const router = Router();
const cartController = new CartController();

// GET /cart
router.get("/", cartController.getCart);

// GET /cart/totals - Get cart totals
router.get("/totals", cartController.getCartTotals);

// POST /cart - Add item to cart
router.post("/", validateBody(AddToCartSchema), cartController.addToCart);

// DELETE /cart - Clear entire cart
router.delete("/", cartController.clearCart);

// PATCH /cart/:itemId - Update cart item quantity
router.patch(
  "/:itemId",
  validateParams(CartItemParamsSchema),
  validateBody(UpdateCartItemSchema),
  cartController.updateCartItem
);

// DELETE /cart/:itemId - Remove item from cart
router.delete(
  "/:itemId",
  validateParams(CartItemParamsSchema),
  cartController.deleteCartItem
);

export default router;
