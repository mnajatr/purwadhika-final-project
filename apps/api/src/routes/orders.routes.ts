import { Router } from "express";
import upload from "../middleware/upload.middleware.js";
import { checkoutController } from "../controllers/checkout.controller.js";
import { paymentController } from "../controllers/payment.controller.js";
import { fulfillmentController } from "../controllers/fulfillment.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();
const controller = {
  createOrder: checkoutController.createOrder.bind(checkoutController),
  listOrders: checkoutController.listOrders.bind(checkoutController),
  getOrderById: checkoutController.getOrderById.bind(checkoutController),
  uploadPaymentProof: paymentController.uploadPaymentProof.bind(paymentController),
  cancelOrder: fulfillmentController.cancelOrder.bind(fulfillmentController),
  confirmOrder: fulfillmentController.confirmOrder.bind(fulfillmentController),
  shipOrder: fulfillmentController.shipOrder.bind(fulfillmentController),
  getOrderCounts: fulfillmentController.getOrderCounts.bind(fulfillmentController),
};

// TODO: Use auth middleware only in production. Define routes once and inject
// the middleware conditionally to avoid duplicated route definitions.
const requireAuth = process.env.NODE_ENV === "production";
const maybeAuth = requireAuth ? [authMiddleware] : [];

// POST /orders - create new order
router.post("/", ...maybeAuth, controller.createOrder);

// GET /orders - list orders with optional filters
router.get("/", ...maybeAuth, controller.listOrders);

// GET /orders/counts - get order counts by status
router.get("/counts", ...maybeAuth, controller.getOrderCounts);

// POST /orders/:id/payment-proof - upload single file field 'proof'
router.post(
  "/:id/payment-proof",
  ...maybeAuth,
  upload.single("proof"),
  controller.uploadPaymentProof
);

// PATCH /orders/:id/cancel - cancel order
router.patch("/:id/cancel", ...maybeAuth, controller.cancelOrder);

// PATCH /orders/:id/confirm - confirm order receipt
router.patch("/:id/confirm", ...maybeAuth, controller.confirmOrder);

// PATCH /orders/:id/ship - mark order as shipped (admin)
router.patch("/:id/ship", ...maybeAuth, controller.shipOrder);

// GET /orders/:id - get order by id
router.get("/:id", ...maybeAuth, controller.getOrderById);

export default router;
