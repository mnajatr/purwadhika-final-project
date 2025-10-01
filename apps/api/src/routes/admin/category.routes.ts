import { Router } from "express";
import { CategoryController } from "../../controllers/category.controller.js";
import { adminAuth } from "../../middleware/admin.middleware.js";

const router = Router();

router.get("/", CategoryController.getAll);
router.get("/:id", CategoryController.getById);
router.post("/", adminAuth, CategoryController.create);
router.put("/:id", adminAuth, CategoryController.update);
router.delete("/:id", adminAuth, CategoryController.delete);

export default router;
