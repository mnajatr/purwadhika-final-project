import { Request, Response } from "express";
import type { Request as ExpressRequest } from "express";
// Reuse the AuthRequest shape used in auth middleware
type AuthRequest = ExpressRequest & { user?: { id: number } };
import { OrderService } from "../services/order.service.js";
// cleaned unused imports
import { prisma } from "@repo/database";
import {
  successResponse,
  errorResponse,
  ERROR_MESSAGES,
} from "../utils/helpers.js";

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
      // allow storeId to be omitted so backend can compute nearest store
      const storeId = toNumber(req.body?.storeId, undefined);
      const items = req.body?.items;
      const userLat = req.body?.userLat ? Number(req.body.userLat) : undefined;
      const userLon = req.body?.userLon ? Number(req.body.userLon) : undefined;
      const addressId = req.body?.addressId
        ? Number(req.body.addressId)
        : undefined;
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
        idempotencyKey,
        userLat,
        userLon,
        addressId
      );
      return res.status(201).json(successResponse(result, "Order created"));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);

      // Map known inventory errors to 400 so frontend can surface actionable UX
      if (
        msg.includes(ERROR_MESSAGES.INVENTORY.INSUFFICIENT_STOCK) ||
        msg.includes(ERROR_MESSAGES.INVENTORY.NO_INVENTORY) ||
        msg.includes(ERROR_MESSAGES.STORE.NO_NEARBY) ||
        msg.toLowerCase().includes("not found")
      ) {
        // Provide a concise client-friendly message and include the raw error
        // in `error` for debugging and an `errors` entry for field-level hints.
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
      if (!id) return res.status(400).json(errorResponse("Invalid order id"));

      // Use prisma directly for a simple read operation including relations.
      // Include product.name for each order item so frontend can render the
      // human-friendly product name instead of a fallback like "Product #3".
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, price: true },
              },
            },
          },
          payment: true,
          shipment: true,
        },
      });

      if (!order) return res.status(404).json(errorResponse("Order not found"));

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

  uploadPaymentProof = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json(errorResponse("Invalid order id"));

      // Expect JSON body: { proofBase64: 'data:image/png;base64,...' }
      const bodyProof = (req as any).body?.proofBase64;
      if (!bodyProof || typeof bodyProof !== "string")
        return res
          .status(400)
          .json(errorResponse("Missing proofBase64 in request body"));

      // data URL format: data:<mime>;base64,<data>
      const matches = bodyProof.match(
        /^data:(image\/(png|jpeg|jpg));base64,(.+)$/
      );
      if (!matches)
        return res.status(400).json(errorResponse("Invalid proof format"));

      const mime = matches[1];
      const b64 = matches[3];
      const allowed = ["image/png", "image/jpeg", "image/jpg"];
      if (!allowed.includes(mime))
        return res.status(400).json(errorResponse("Invalid file type"));

      const MAX_BYTES = 1 * 1024 * 1024;
      const buffer = Buffer.from(b64, "base64");
      if (buffer.length > MAX_BYTES)
        return res.status(400).json(errorResponse("File too large"));

      // Hand off base64 to service which will upload to Cloudinary and return
      // proof URL plus the updated payment and order status so the frontend
      // can update UI without an immediate refetch.
      const uploadResult = await this.service.uploadPaymentProof(id, b64, mime);

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
}
