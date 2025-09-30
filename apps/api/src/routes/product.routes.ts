import { Router } from "express";
import { ProductController } from "../controllers/product.controller.js";
import { adminAuth } from "../middleware/admin.middleware.js";

const router = Router();

router.get("/", ProductController.getAll);
router.get("/:slug", ProductController.getBySlug);
router.post("/", adminAuth, ProductController.create);
router.put("/:slug", adminAuth, ProductController.update);
router.patch("/:slug/deactivate", adminAuth, ProductController.deactivate);
router.patch("/:slug/activate", adminAuth, ProductController.activate);
router.delete("/:slug", adminAuth, ProductController.delete);

export default router;
