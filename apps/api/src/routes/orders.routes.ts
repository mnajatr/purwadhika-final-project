import { Router } from "express";
import upload from "../middleware/upload.middleware.js";
import { OrderController } from "../controllers/order.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();
const controller = new OrderController();

// POST /orders - create new order
// TODO(dev): Allow unauthenticated POST in development for easier testing
// Remove this dev-only route or ensure authMiddleware is applied before
// deploying to production (Feature 1). The conditional below keeps the
// route protected when NODE_ENV === 'production'.
if (process.env.NODE_ENV !== "production") {
  // Dev: let controller handle userId fallback (query/body/header) so
  // frontend can test using ?userId=4 or body.userId without sending auth
  router.post("/", controller.createOrder);
  router.post(
    "/:id/payment-proof",
    upload.single("proof"),
    controller.uploadPaymentProof
  );
  router.patch("/:id/cancel", controller.cancelOrder);
  router.get("/:id", controller.getOrderById);
} else {
  // Production: require auth middleware
  router.post("/", authMiddleware, controller.createOrder);
  router.post(
    "/:id/payment-proof",
    authMiddleware,
    upload.single("proof"),
    controller.uploadPaymentProof
  );
  router.patch("/:id/cancel", authMiddleware, controller.cancelOrder);
  router.get("/:id", authMiddleware, controller.getOrderById);
}

export default router;
