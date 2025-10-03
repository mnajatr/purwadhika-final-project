import { Router } from "express";
import { checkoutController } from "../../controllers/checkout.controller.js";
import { fulfillmentController } from "../../controllers/fulfillment.controller.js";
import { orderReadService } from "../../services/order.read.service.js";
import {
  restrictToAssignedStoreIfNeeded,
  scopeListToAssignedStore,
} from "../../middleware/admin.middleware.js";

const router = Router();

router.get("/", scopeListToAssignedStore, checkoutController.listOrders);

router.get(
  "/:id",
  restrictToAssignedStoreIfNeeded((id) => orderReadService.getOrderStoreId(id)),
  checkoutController.getOrderById
);

router.patch(
  "/:id/confirm",
  restrictToAssignedStoreIfNeeded((id) => orderReadService.getOrderStoreId(id)),
  fulfillmentController.confirmOrder
);

router.patch(
  "/:id/ship",
  restrictToAssignedStoreIfNeeded((id) => orderReadService.getOrderStoreId(id)),
  fulfillmentController.shipOrder
);

router.patch(
  "/:id/cancel",
  restrictToAssignedStoreIfNeeded((id) => orderReadService.getOrderStoreId(id)),
  fulfillmentController.cancelOrder
);

export default router;
