import { Router } from "express";
import { DiscountController } from "../../controllers/discount.controller.js";
import { adminAuth } from "../../middleware/admin.middleware.js";

const router = Router();

router.get("/", DiscountController.getAll);
router.get("/:id", DiscountController.getById);
router.post("/by-products", DiscountController.getDiscountsByProductIds);
router.post("/", adminAuth, DiscountController.create);
router.put("/:id", adminAuth, DiscountController.update);
router.delete("/:id", adminAuth, DiscountController.delete);

export default router;
