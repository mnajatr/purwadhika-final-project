import { Router } from "express";
import * as categoryController from "../../controllers/category.controller.js";
import { adminAuth } from "../../middleware/admin.middleware.js";

const router = Router();

// Semua route ini wajib admin
router.get("/", adminAuth, categoryController.getCategories);
router.get("/:id", adminAuth, categoryController.getCategoryById);
router.post("/", adminAuth, categoryController.createCategory);
router.put("/:id", adminAuth, categoryController.updateCategory);
router.delete("/:id", adminAuth, categoryController.deleteCategory);

export default router;
