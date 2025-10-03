import { Router } from "express";
import upload from "../middleware/upload.middleware.js";
import { checkoutController } from "../controllers/checkout.controller.js";
import { paymentController } from "../controllers/payment.controller.js";
import { fulfillmentController } from "../controllers/fulfillment.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

const requireAuth = process.env.NODE_ENV === "production";
const maybeAuth = requireAuth ? [authMiddleware] : [];

router.post("/", ...maybeAuth, checkoutController.createOrder);

router.get("/", ...maybeAuth, checkoutController.listOrders);

router.get("/counts", ...maybeAuth, fulfillmentController.getOrderCounts);

router.post(
  "/:id/payment-proof",
  ...maybeAuth,
  upload.single("proof"),
  paymentController.uploadPaymentProof
);

router.post("/:id/snap", ...maybeAuth, paymentController.createSnap);

router.patch("/:id/cancel", ...maybeAuth, fulfillmentController.cancelOrder);

router.patch("/:id/confirm", ...maybeAuth, fulfillmentController.confirmOrder);

router.patch("/:id/ship", ...maybeAuth, fulfillmentController.shipOrder);

router.get("/:id", ...maybeAuth, checkoutController.getOrderById);

export default router;
