import { Router } from "express";
import upload from "../middleware/upload.middleware.js";
import { checkoutController } from "../controllers/checkout.controller.js";
import { paymentController } from "../controllers/payment.controller.js";
import { fulfillmentController } from "../controllers/fulfillment.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", authMiddleware, checkoutController.createOrder);

router.get("/", authMiddleware, checkoutController.listOrders);

router.get("/counts", authMiddleware, fulfillmentController.getOrderCounts);

router.post(
  "/:id/payment-proof",
  authMiddleware,
  upload.single("proof"),
  paymentController.uploadPaymentProof
);

router.post("/:id/snap", authMiddleware, paymentController.createSnap);

router.patch("/:id/cancel", authMiddleware, fulfillmentController.cancelOrder);

router.patch("/:id/confirm", authMiddleware, fulfillmentController.confirmOrder);

router.patch("/:id/ship", authMiddleware, fulfillmentController.shipOrder);

router.get("/:id", authMiddleware, checkoutController.getOrderById);

export default router;
