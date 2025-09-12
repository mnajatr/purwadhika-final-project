import { Router } from "express";
import upload from "../middleware/upload.middleware.js";
import { OrderController } from "../controllers/order.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();
const controller = new OrderController();

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

// GET /orders/:id - get order by id
router.get("/:id", ...maybeAuth, controller.getOrderById);

export default router;
