import { Request, Response, NextFunction } from "express";
import { prisma } from "@repo/database";

type AuthRequest = Request & { user?: { id?: number; role?: string; storeId?: number } };

// Helper: convert value ke number dengan fallback
function toNumber(value: unknown, fallback?: number) {
  const n = Number(value);
  return Number.isNaN(n) ? fallback : n;
}

// --- Middleware utama: adminAuth ---
export async function adminAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthRequest;

    // 1️⃣ Ambil userId dari req.user (kalau JWT sudah isi)
    let userId = authReq.user?.id;

    // 2️⃣ Kalau ga ada, fallback ke header/query di DEV mode
    if (!userId && process.env.NODE_ENV !== "production") {
      userId =
        toNumber(req.headers["x-dev-user-id"]) ||
        toNumber(req.query.userId) ||
        toNumber(req.body?.userId);
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // 3️⃣ Fetch user dari DB
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { storeAssignments: { take: 1 } },
    });

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.role !== "SUPER_ADMIN" && user.role !== "STORE_ADMIN") {
      return res.status(403).json({ success: false, message: "Forbidden: Admin only" });
    }

    // 4️⃣ Jika STORE_ADMIN, wajib punya assignment ke store. Jika tidak, block.
    if (user.role === "STORE_ADMIN" && (!user.storeAssignments || user.storeAssignments.length === 0)) {
      return res.status(403).json({ success: false, message: "Forbidden: store admin has no store assignment" });
    }

    // 5️⃣ Tempel role & storeId ke req.user (assign concrete object to satisfy TS)
    const userAttach: { id: number; role: string; storeId?: number } = {
      id: user.id,
      role: user.role,
    };
    if (user.role === "STORE_ADMIN" && user.storeAssignments.length > 0) {
      userAttach.storeId = user.storeAssignments[0].storeId;
    }
    authReq.user = userAttach;

    next();
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: String(err) });
  }
}

// --- Middleware tambahan: restrict store_admin ke tokonya sendiri ---
export function restrictToAssignedStoreIfNeeded(
  getResourceStore: (id: number) => Promise<number | null>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;

    // SUPER_ADMIN bebas
    if (authReq.user?.role === "SUPER_ADMIN") return next();

    // STORE_ADMIN → cek storeId
    if (authReq.user?.role === "STORE_ADMIN") {
      const resourceId = Number(req.params.id);
      if (!resourceId) {
        return res.status(400).json({ success: false, message: "Missing resource id" });
      }

      try {
        const storeId = await getResourceStore(resourceId);
        if (!storeId) return res.status(404).json({ success: false, message: "Resource not found" });

        if (storeId !== authReq.user.storeId) {
          return res
            .status(403)
            .json({ success: false, message: "Forbidden: Not your store" });
        }

        return next();
      } catch (err) {
        return res
          .status(500)
          .json({ success: false, message: "Store validation error", error: String(err) });
      }
    }

    // Kalau bukan admin → block
    return res.status(403).json({ success: false, message: "Forbidden: Not an admin" });
  };
}