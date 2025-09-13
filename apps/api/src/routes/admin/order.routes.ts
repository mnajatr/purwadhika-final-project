import { Router } from "express";
import { prisma } from "@repo/database";
import { OrderController } from "../../controllers/order.controller.js";
import { restrictToAssignedStoreIfNeeded } from "../../middleware/admin.middleware.js";

const router = Router();
const controller = new OrderController();

// Helper untuk cek store dari order
async function fetchOrderStore(id: number): Promise<number | null> {
  const order = await prisma.order.findUnique({
    where: { id },
    select: { storeId: true },
  });
  return order?.storeId ?? null;
}

// --- Routes ---
// Middleware: kalau pemanggil STORE_ADMIN, batasi list ke store miliknya
function scopeListToAssignedStore(req: any, _res: any, next: any) {
  const user = req.user as { role?: string; storeId?: number } | undefined;
  if (user && user.role === "STORE_ADMIN" && user.storeId) {
  // Do NOT mutate req.query (some Express versions make it readonly).
  // Instead attach a synthetic property that controllers can prefer.
  req.storeScopedId = user.storeId;
  }
  return next();
}

// GET /admin/orders
router.get("/", scopeListToAssignedStore, controller.listOrders);

// GET /admin/orders/:id
router.get("/:id", restrictToAssignedStoreIfNeeded(fetchOrderStore), controller.getOrderById);

// PATCH /admin/orders/:id/confirm
router.patch("/:id/confirm", restrictToAssignedStoreIfNeeded(fetchOrderStore), controller.confirmOrder);

// PATCH /admin/orders/:id/ship
router.patch("/:id/ship", restrictToAssignedStoreIfNeeded(fetchOrderStore), controller.shipOrder);

// PATCH /admin/orders/:id/cancel
router.patch("/:id/cancel", restrictToAssignedStoreIfNeeded(fetchOrderStore), controller.cancelOrder);

export default router;