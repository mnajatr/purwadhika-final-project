import { Request, Response } from "express";
import type { Request as ExpressRequest } from "express";
import { OrderService } from "../services/order.service.js";
import { successResponse, errorResponse } from "../utils/helpers.js";

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

export class FulfillmentController {
  private service = new OrderService();

  private _handleOrderStatusError(e: unknown, res: Response, defaultMessage: string) {
    const msg = e instanceof Error ? e.message : String(e);

    if (msg.includes("not found")) {
      return res.status(404).json(errorResponse("Order not found", msg));
    }

    if (msg.includes("Cannot") || msg.includes("already")) {
      return res.status(409).json(errorResponse("Cannot change order status", msg));
    }

    return res.status(500).json(errorResponse(defaultMessage, msg));
  }

  cancelOrder = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!id) {
        return res.status(400).json(errorResponse("Invalid order id"));
      }

      const userId = pickUserId(req);
      if (!userId) {
        return res.status(400).json(errorResponse("Missing userId in request"));
      }

      const result = await this.service.cancelOrder(id, userId);
      return res.status(200).json(successResponse(result, "Order cancelled"));
    } catch (e) {
      return this._handleOrderStatusError(e, res, "Failed to cancel order");
    }
  };

  confirmOrder = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!id) {
        return res.status(400).json(errorResponse("Invalid order id"));
      }

      const userId = pickUserId(req);
      if (!userId) {
        return res.status(400).json(errorResponse("Missing userId in request"));
      }

      const result = await this.service.confirmOrder(id, userId);
      return res.status(200).json(successResponse(result, "Order confirmed"));
    } catch (e) {
      return this._handleOrderStatusError(e, res, "Failed to confirm order");
    }
  };

  shipOrder = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!id) {
        return res.status(400).json(errorResponse("Invalid order id"));
      }

      const userId = pickUserId(req);
      const result = await this.service.shipOrder(id, userId);
      return res.status(200).json(successResponse(result, "Order shipped"));
    } catch (e) {
      return this._handleOrderStatusError(e, res, "Failed to ship order");
    }
  };

  getOrderCounts = async (req: Request, res: Response) => {
    try {
      const userId = pickUserId(req);
      if (!userId) {
        return res.status(400).json(errorResponse("Missing userId in request"));
      }

      const counts = await this.service.getOrderCountsByStatus(userId);

      return res
        .status(200)
        .json(successResponse(counts, "Order counts retrieved"));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return res
        .status(500)
        .json(errorResponse("Failed to get order counts", msg));
    }
  };
}

export const fulfillmentController = new FulfillmentController();
