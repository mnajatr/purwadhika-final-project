import { Router } from "express";
import { ProductController } from "../controllers/product.controller.js";

const router = Router();

router.get("/", ProductController.getAll);
router.get("/:slug", ProductController.getBySlug);
router.post("/", ProductController.create);
router.put("/:slug", ProductController.update);
router.patch("/:slug/deactivate", ProductController.deactivate);
router.patch("/:slug/activate", ProductController.activate);
router.delete("/:slug", ProductController.delete);

export default router;
