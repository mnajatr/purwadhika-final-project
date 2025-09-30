import { Router } from "express";
import { discountController } from "../../controllers/discount.controller.js";
import { adminAuth } from "../../middleware/admin.middleware.js";

const router = Router();

router.get("/", adminAuth, discountController.getAll);
router.post("/by-products", discountController.getDiscountsByProductIds);
router.get("/:id", discountController.getById);
router.post("/", adminAuth, discountController.create);
router.put("/:id", adminAuth, discountController.update);
router.delete("/:id", adminAuth, discountController.delete);

export default router;
