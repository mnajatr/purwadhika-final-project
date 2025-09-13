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

export class PaymentController {
  private service = new OrderService();

  uploadPaymentProof = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!id) {
        return res.status(400).json(errorResponse("Invalid order id"));
      }

      const f = (req as any).file as
        | { buffer?: Buffer; mimetype?: string }
        | undefined;
      if (!f || !f.buffer) {
        return res
          .status(400)
          .json(errorResponse("Missing file 'proof' in request"));
      }

      const allowed = ["image/png", "image/jpeg", "image/jpg"];
      const mime = f.mimetype ?? "application/octet-stream";
      if (!allowed.includes(mime)) {
        return res.status(400).json(errorResponse("Invalid file type"));
      }

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
        .json(successResponse({ proofUrl, payment, orderStatus }, "Upload saved"));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return res.status(500).json(errorResponse("Upload failed", msg));
    }
  };
}

export const paymentController = new PaymentController();
