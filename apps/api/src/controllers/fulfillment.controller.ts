import { Request, Response } from "express";
import type { Request as ExpressRequest } from "express";
import { fulfillmentService } from "../services/fulfillment.service.js";
import { orderReadService } from "../services/order.read.service.js";
import { createValidationError } from "../errors/app.error.js";

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
  private fulfillmentService = fulfillmentService;
  private orderReadService = orderReadService;

  cancelOrder = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!id) {
      throw createValidationError("Invalid order id");
    }

    const userId = pickUserId(req);
    if (!userId) {
      throw createValidationError("Missing userId in request");
    }

    const authReq = req as any;
    const isAdmin =
      authReq.user &&
      (authReq.user.role === "SUPER_ADMIN" ||
        authReq.user.role === "STORE_ADMIN");
    const requester = isAdmin ? undefined : userId;
    const actorId = isAdmin ? Number(authReq.user?.id) : undefined;

    const result = await this.fulfillmentService.cancelOrder(
      id,
      requester as any,
      actorId as any
    );

    return res.status(200).json({
      message: "Order cancelled",
      data: result,
    });
  };

  confirmOrder = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!id) {
      throw createValidationError("Invalid order id");
    }

    const userId = pickUserId(req);
    if (!userId) {
      throw createValidationError("Missing userId in request");
    }

    const authReq = req as any;
    const isAdmin =
      authReq.user &&
      (authReq.user.role === "SUPER_ADMIN" ||
        authReq.user.role === "STORE_ADMIN");
    const requester = isAdmin ? undefined : userId;
    const actorId = isAdmin ? Number(authReq.user?.id) : undefined;

    const result = await this.fulfillmentService.confirmOrder(
      id,
      requester as any,
      actorId as any
    );

    return res.status(200).json({
      message: "Order confirmed",
      data: result,
    });
  };

  shipOrder = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!id) {
      throw createValidationError("Invalid order id");
    }

    const userId = pickUserId(req);
    const result = await this.fulfillmentService.shipOrder(id, userId);

    return res.status(200).json({
      message: "Order shipped",
      data: result,
    });
  };

  getOrderCounts = async (req: Request, res: Response) => {
    const userId = pickUserId(req);
    if (!userId) {
      throw createValidationError("Missing userId in request");
    }

    const counts = await this.orderReadService.getOrderCountsByStatus(userId);

    return res.status(200).json({
      message: "Order counts retrieved",
      data: counts,
    });
  };
}

export const fulfillmentController = new FulfillmentController();
