import { checkoutController } from "./checkout.controller.js";
import { paymentController } from "./payment.controller.js";
import { fulfillmentController } from "./fulfillment.controller.js";

// Keep a compatible API: OrderController class remains exported but methods
// forward to the new, smaller controllers. This avoids breaking imports.
export class OrderController {
  createOrder = checkoutController.createOrder.bind(checkoutController);
  listOrders = checkoutController.listOrders.bind(checkoutController);
  getOrderById = checkoutController.getOrderById.bind(checkoutController);
  uploadPaymentProof = paymentController.uploadPaymentProof.bind(paymentController);
  cancelOrder = fulfillmentController.cancelOrder.bind(fulfillmentController);
  confirmOrder = fulfillmentController.confirmOrder.bind(fulfillmentController);
  shipOrder = fulfillmentController.shipOrder.bind(fulfillmentController);
  getOrderCounts = fulfillmentController.getOrderCounts.bind(fulfillmentController);
}
