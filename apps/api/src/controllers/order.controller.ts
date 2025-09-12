import { Request, Response } from "express";
import type { Request as ExpressRequest } from "express";
import { OrderService } from "../services/order.service.js";
import { orderReadService } from "../services/order.read.service.js";
import { prisma } from "@repo/database";
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

/**
 * Order Controller - Handles HTTP requests for order operations
 * Uses the refactored OrderService which delegates to specialized services
 */
export class OrderController {
  private service = new OrderService();

  /**
   * GET /orders - List orders with filters and pagination
   */
  listOrders = async (req: Request, res: Response) => {
    try {
      const userId = pickUserId(req);
      const status = req.query.status as string | undefined;
      const q = req.query.q as string | undefined;
      const dateFrom = req.query.dateFrom as string | undefined;
      const dateTo = req.query.dateTo as string | undefined;
      const page = Number(req.query.page ?? 1);
      const pageSize = Number(req.query.pageSize ?? 20);

      // Log the received parameters for debugging
      console.log("Order list filters:", {
        userId,
        status,
        q,
        dateFrom,
        dateTo,
        page,
        pageSize,
      });

      const result = await this.service.listOrders({
        userId,
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
      console.error("Error listing orders:", msg);
      return res.status(500).json(errorResponse("Failed to list orders", msg));
    }
  };

  /**
   * POST /orders - Create a new order
   */
  createOrder = async (req: Request, res: Response) => {
    try {
      const userId = pickUserId(req);
      if (!userId) {
        return res.status(400).json(errorResponse("Missing userId in request"));
      }

      // Extract request parameters
      const storeId = toNumber(req.body?.storeId, undefined);
      const items = req.body?.items;
      const userLat = req.body?.userLat ? Number(req.body.userLat) : undefined;
      const userLon = req.body?.userLon ? Number(req.body.userLon) : undefined;
      const addressId = req.body?.addressId ? Number(req.body.addressId) : undefined;
      
      // Idempotency key handling
      const idempotencyKey =
        (req.headers["idempotency-key"] as string) ||
        req.body?.idempotencyKey ||
        req.query?.idempotencyKey;

      // Validate items
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json(errorResponse("Missing items in order"));
      }

      // Validate item structure
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
        addressId
      );

      return res.status(201).json(successResponse(result, "Order created"));
    } catch (e) {
      return this._handleOrderError(e, res, "Failed to create order");
    }
  };

  /**
   * GET /orders/:id - Get order by ID
   */
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

      // Ownership check: allow request if same user or in dev fallback
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

  /**
   * POST /orders/:id/payment-proof - Upload payment proof
   */
  uploadPaymentProof = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!id) {
        return res.status(400).json(errorResponse("Invalid order id"));
      }

      // Validate file upload
      const f = (req as any).file as
        | { buffer?: Buffer; mimetype?: string }
        | undefined;
      if (!f || !f.buffer) {
        return res
          .status(400)
          .json(errorResponse("Missing file 'proof' in request"));
      }

      // Validate file type
      const allowed = ["image/png", "image/jpeg", "image/jpg"];
      const mime = f.mimetype ?? "application/octet-stream";
      if (!allowed.includes(mime)) {
        return res.status(400).json(errorResponse("Invalid file type"));
      }

      // Validate file size
      const MAX_BYTES = 1 * 1024 * 1024; // 1MB
      if (f.buffer.length > MAX_BYTES) {
        return res.status(400).json(errorResponse("File too large"));
      }

      const uploadResult = await this.service.uploadPaymentProof(
        id,
        f.buffer,
        mime
      );

      const { proofUrl, payment, orderStatus } = uploadResult || ({} as any);

      return res
        .status(200)
        .json(
          successResponse({ proofUrl, payment, orderStatus }, "Upload saved")
        );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return res.status(500).json(errorResponse("Upload failed", msg));
    }
  };

  /**
   * PATCH /orders/:id/cancel - Cancel order
   */
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

  /**
   * PATCH /orders/:id/confirm - Confirm order receipt
   */
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

  /**
   * PATCH /orders/:id/ship - Mark order as shipped (admin)
   */
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

  /**
   * GET /orders/counts - Get order counts by status
   */
  getOrderCounts = async (req: Request, res: Response) => {
    try {
      const userId = pickUserId(req);
      if (!userId) {
        return res.status(400).json(errorResponse("Missing userId in request"));
      }

      console.log("Getting order counts for userId:", userId);
      const counts = await this.service.getOrderCountsByStatus(userId);
      console.log("Order counts:", counts);

      return res
        .status(200)
        .json(successResponse(counts, "Order counts retrieved"));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("Error getting order counts:", msg);
      return res
        .status(500)
        .json(errorResponse("Failed to get order counts", msg));
    }
  };

  /**
   * Private helper to handle order creation errors
   */
  private _handleOrderError(e: unknown, res: Response, defaultMessage: string) {
    const msg = e instanceof Error ? e.message : String(e);

    // Map known inventory errors to 400 so frontend can surface actionable UX
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

    return res.status(500).json(errorResponse(defaultMessage, msg));
  }

  /**
   * Private helper to handle order status change errors
   */
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
}
