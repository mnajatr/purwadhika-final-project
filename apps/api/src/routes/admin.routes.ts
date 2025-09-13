import { Router } from "express";
import orderRoutes from "./admin/order.routes.js";
import { adminAuth } from "../middleware/admin.middleware.js";

const router = Router();

// All admin routes require admin authentication. Mount different admin
// IMEL: sub-routers under this path. Additional admin routers (products,
// users, etc.) should be added here.
router.use(adminAuth);

// Mount order management routes at /admin/orders
router.use("/orders", orderRoutes);

export default router;
