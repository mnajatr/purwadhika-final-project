import { Request, Response } from "express";
import type { Request as ExpressRequest } from "express";
import { OrderService } from "../services/order.service.js";
import { midtransService } from "../services/midtrans.service.js";
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

      // MIME and size validations are enforced by multer in upload.middleware
      const mime = f.mimetype ?? "application/octet-stream";

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

  createSnap = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json(errorResponse("Invalid order id"));

      const result = await midtransService.createSnapTransaction(id);

      const clientKey = process.env.MIDTRANS_CLIENT_KEY || null;

      return res
        .status(200)
        .json(
          successResponse(
            {
              clientKey,
              snapToken: result.snapToken,
              redirectUrl: result.redirectUrl,
            },
            "Snap token created"
          )
        );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return res
        .status(500)
        .json(errorResponse("Failed to create Snap token", msg));
    }
  };

  midtransWebhook = async (req: Request, res: Response) => {
    try {
      const payload = req.body;
      // Let service validate signature and process notification
      await midtransService.handleNotification(payload);
      // Midtrans expects 200 OK to consider notification processed
      return res.status(200).json({ status: "ok" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return res.status(400).json({ status: "error", message: msg });
    }
  };
}

export const paymentController = new PaymentController();
