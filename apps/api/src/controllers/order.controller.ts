import { Request, Response } from "express";
import type { Request as ExpressRequest } from "express";
// Reuse the AuthRequest shape used in auth middleware
type AuthRequest = ExpressRequest & { user?: { id: number } };
import { OrderService } from "../services/order.service.js";
import { successResponse, errorResponse } from "../utils/helpers.js";

function toNumber(value: unknown, fallback?: number) {
  if (value === undefined || value === null) return fallback;
  const n = Number(value);
  return Number.isNaN(n) ? fallback : n;
}

function pickUserId(req: Request): number | undefined {
  // Prefer authenticated user id if present
  const authReq = req as AuthRequest;
  const authUser = Number(authReq.user?.id ?? undefined);
  if (authUser) return authUser;

  // TODO: temporary dev-friendly fallback so frontend can test without auth.
  // Accepts header `x-dev-user-id`, query `devUserId` or `userId`, or body.userId.
  // Remove or restrict this when real auth (Feature 1) is in place.
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

export class OrderController {
  private service = new OrderService();

  createOrder = async (req: Request, res: Response) => {
    try {
      const userId = pickUserId(req);
      const storeId = toNumber(req.body?.storeId, undefined) ?? 1;
      const items = req.body?.items;
      // TODO: Accept and forward an idempotency key so retries from the client
      // (or network retries) don't create duplicate orders. Replace in-memory
      // strategy with DB-backed idempotency table in production.
      const idempotencyKey =
        (req.headers["idempotency-key"] as string) ||
        req.body?.idempotencyKey ||
        req.query?.idempotencyKey;

      if (!userId)
        return res.status(400).json(errorResponse("Missing userId in request"));
      if (!Array.isArray(items) || items.length === 0)
        return res.status(400).json(errorResponse("Missing items in order"));

      const result = await this.service.createOrder(
        userId,
        storeId,
        items,
        idempotencyKey
      );
      return res.status(201).json(successResponse(result, "Order created"));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const isBad = msg.includes("Insufficient") || msg.includes("not found");
      const status = isBad ? 400 : 500;
      return res
        .status(status)
        .json(errorResponse("Failed to create order", msg));
    }
  };
}
