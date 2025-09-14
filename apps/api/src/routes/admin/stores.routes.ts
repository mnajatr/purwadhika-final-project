import { Router } from "express";
import { prisma } from "@repo/database";
import { adminAuth } from "../../middleware/admin.middleware.js";

const router = Router();

// Return simple list of stores (id and name) for admin UI filtering.
// Protected by adminAuth so only admins can fetch.
router.use(adminAuth);

router.get("/", async (req, res) => {
  try {
    const stores = await prisma.store.findMany({ select: { id: true, name: true } });
    return res.status(200).json({ success: true, data: stores });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch stores", error: String(err) });
  }
});

export default router;
