import { Router } from "express";
import { paymentController } from "../controllers/payment.controller.js";

const router = Router();

// Midtrans webhook/notification endpoint
router.post(
  "/webhook",
  paymentController.midtransWebhook.bind(paymentController)
);

export default router;
