import { Router } from "express";
import { discountController } from "../../controllers/discount.controller.js";

const router = Router();

router.get("/", discountController.getAll);
router.get("/:id", discountController.getById);
router.post("/", discountController.create);
router.put("/:id", discountController.update);
router.delete("/:id", discountController.delete);

export default router;
