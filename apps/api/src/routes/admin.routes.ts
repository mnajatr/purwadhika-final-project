import { Router } from "express";
import orderRoutes from "./admin/order.routes.js";
import storesRoutes from "./admin/stores.routes.js";
import inventoryRoutes from "./admin/inventory.routes.js";
import { adminAuth } from "../middleware/admin.middleware.js";

const router = Router();

// All admin routes require admin authentication. Mount different admin
// IMEL: sub-routers under this path. Additional admin routers (products,
// users, etc.) should be added here.
router.use(adminAuth);

// Mount order management routes at /admin/orders
router.use("/orders", orderRoutes);
// Mount admin stores listing at /admin/stores (for super_admin filtering)
router.use("/stores", storesRoutes);
// Mount inventory management routes at /admin/inventory
router.use("/inventory", inventoryRoutes);
// Mount admin profile at /admin/me
router.get("/me", async (req: any, res) => {
  try {
    const user = req.user as { id: number; role: string; storeId?: number } | undefined;
    if (!user) return res.status(404).json({ success: false, message: "Not found" });

    // Return basic info and store assignment
    return res.status(200).json({ success: true, data: { id: user.id, role: user.role, storeId: user.storeId ?? null } });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch profile", error: String(err) });
  }
});

export default router;
