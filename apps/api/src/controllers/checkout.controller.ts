import { Request, Response } from "express";
import type { Request as ExpressRequest } from "express";
import { OrderService } from "../services/order.service.js";
import { orderReadService } from "../services/order.read.service.js";
import {
  successResponse,
  errorResponse,
  ERROR_MESSAGES,
} from "../utils/helpers.js";

// Reuse the AuthRequest shape used in auth middleware
type AuthRequest = ExpressRequest & { user?: { id: number } };

function toNumber(value: unknown, fallback?: number) {
  if (value === undefined || value === null) return fallback;
  const n = Number(value);
  return Number.isNaN(n) ? fallback : n;
}

function pickUserId(req: Request): number | undefined {
  const authReq = req as AuthRequest;
  const authUser = Number(authReq.user?.id ?? undefined);
  if (authUser) return authUser;

  if (process.env.NODE_ENV !== "production") {
    const header = toNumber(req.headers["x-dev-user-id"], undefined);
    if (header) return header;
    const q = toNumber(
      req.query?.userId,
      toNumber(req.query?.devUserId, toNumber(req.body?.userId, undefined))
    );
    if (q) return q;
  }

  return undefined;
}

export class CheckoutController {
  private service = new OrderService();

  listOrders = async (req: Request, res: Response) => {
    try {
      const userId = pickUserId(req);
      // If request has an authenticated admin attached (from adminAuth middleware),
      // do not scope the listing to a specific user. Admin endpoints should not
      // be filtered by the requesting user's id.
      const authReq = req as any;
      const effectiveUserId = authReq.user && (authReq.user.role === "SUPER_ADMIN" || authReq.user.role === "STORE_ADMIN")
        ? undefined
        : userId;
      const status = req.query.status as string | undefined;
      const q = req.query.q as string | undefined;
      const dateFrom = req.query.dateFrom as string | undefined;
      const dateTo = req.query.dateTo as string | undefined;
      const page = Number(req.query.page ?? 1);
      const pageSize = Number(req.query.pageSize ?? 20);
  // Prefer explicitly-attached store id for admin scoping (set by admin middleware)
  const storeIdFromMiddleware = authReq.storeScopedId ?? authReq.user?.storeId;
  const storeId = storeIdFromMiddleware ?? (req.query?.storeId ? Number(req.query.storeId) : undefined);

  const filters = { userId: effectiveUserId, storeId, status, q, dateFrom, dateTo, page, pageSize };
  console.log("[DEBUG] listOrders filters:", JSON.stringify(filters));

  const result = await this.service.listOrders({
        userId: effectiveUserId,
        storeId,
        status,
        q,
        dateFrom,
        dateTo,
        page,
        pageSize,
      });


      return res.status(200).json(successResponse(result));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return res.status(500).json(errorResponse("Failed to list orders", msg));
    }
  };

  createOrder = async (req: Request, res: Response) => {
    try {
      const userId = pickUserId(req);
      if (!userId) {
        return res.status(400).json(errorResponse("Missing userId in request"));
      }

      const storeId = toNumber(req.body?.storeId, undefined);
      const items = req.body?.items;
      const userLat = req.body?.userLat ? Number(req.body.userLat) : undefined;
      const userLon = req.body?.userLon ? Number(req.body.userLon) : undefined;
      const addressId = req.body?.addressId ? Number(req.body.addressId) : undefined;
      const paymentMethod = req.body?.paymentMethod as string | undefined;

      const idempotencyKey =
        (req.headers["idempotency-key"] as string) ||
        req.body?.idempotencyKey ||
        req.query?.idempotencyKey;

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json(errorResponse("Missing items in order"));
      }

      for (const item of items) {
        if (!item.productId || !item.qty || item.qty <= 0) {
          return res.status(400).json(
            errorResponse("Invalid item structure", "Each item must have productId and positive qty")
          );
        }
      }

      const result = await this.service.createOrder(
        userId,
        storeId,
        items,
        idempotencyKey,
        userLat,
        userLon,
        addressId,
        paymentMethod
      );

      return res.status(201).json(successResponse(result, "Order created"));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);

      if (
        msg.includes(ERROR_MESSAGES.INVENTORY.INSUFFICIENT_STOCK) ||
        msg.includes(ERROR_MESSAGES.INVENTORY.NO_INVENTORY) ||
        msg.includes(ERROR_MESSAGES.STORE.NO_NEARBY) ||
        msg.toLowerCase().includes("not found")
      ) {
        return res
          .status(400)
          .json(
            errorResponse("Order cannot be created", msg, [
              { field: "items", message: msg },
            ])
          );
      }

      return res.status(500).json(errorResponse("Failed to create order", msg));
    }
  };

  getOrderById = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!id) {
        return res.status(400).json(errorResponse("Invalid order id"));
      }

      const order = await orderReadService.getOrderById(id);
      if (!order) {
        return res.status(404).json(errorResponse("Order not found"));
      }

      const userId = pickUserId(req);
      if (
        userId &&
        order.userId !== userId &&
        process.env.NODE_ENV === "production"
      ) {
        return res.status(403).json(errorResponse("Forbidden"));
      }

      return res.status(200).json(successResponse(order));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return res.status(500).json(errorResponse("Failed to fetch order", msg));
    }
  };
}

export const checkoutController = new CheckoutController();
