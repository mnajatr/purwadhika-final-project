import { Router } from "express";
import { cartController } from "../controllers/cart.controller.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validation.middleware.js";
import {
  AddToCartSchema,
  UpdateCartItemSchema,
  CartItemParamsSchema,
  UserQuerySchema,
} from "@repo/schemas";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/",
  authMiddleware,
  validateQuery(UserQuerySchema),
  cartController.getCart
);

router.get(
  "/totals",
  authMiddleware,
  validateQuery(UserQuerySchema),
  cartController.getCartTotals
);

router.post(
  "/",
  authMiddleware,
  validateBody(AddToCartSchema),
  cartController.addToCart
);

router.delete("/", authMiddleware, cartController.clearCart);

router.patch(
  "/:itemId",
  authMiddleware,
  validateParams(CartItemParamsSchema),
  validateBody(UpdateCartItemSchema),
  cartController.updateCartItem
);

router.delete(
  "/:itemId",
  authMiddleware,
  validateParams(CartItemParamsSchema),
  cartController.deleteCartItem
);

export default router;
