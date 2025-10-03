import { Request, Response } from "express";
import type { Request as ExpressRequest } from "express";
import { paymentService } from "../services/payment.service.js";
import { midtransService } from "../services/midtrans.service.js";
import { AppError, createValidationError } from "../errors/app.error.js";

type AuthRequest = ExpressRequest & { user?: { id: number } };

export class PaymentController {
  private paymentService = paymentService;

  uploadPaymentProof = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!id) throw createValidationError("Invalid order id");

      const f = (req as any).file as
        | { buffer?: Buffer; mimetype?: string }
        | undefined;
      if (!f || !f.buffer)
        throw createValidationError("Missing file 'proof' in request");

      // MIME and size validations are enforced by multer in upload.middleware
      const mime = f.mimetype ?? "application/octet-stream";

      const uploadResult = await this.paymentService.uploadPaymentProof(
        id,
        f.buffer,
        mime
      );

      const { proofUrl, payment, orderStatus } = uploadResult || ({} as any);

      return res.status(200).json({
        message: "Upload saved",
        data: { proofUrl, payment, orderStatus },
      });
    } catch (e) {
      if (e instanceof AppError) {
        return res.status(e.statusCode).json({ message: e.message });
      }
      const msg = e instanceof Error ? e.message : String(e);
      return res.status(500).json({ message: "Upload failed", error: msg });
    }
  };

  createSnap = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!id) throw createValidationError("Invalid order id");

      const result = await midtransService.createSnapTransaction(id);

      const clientKey = process.env.MIDTRANS_CLIENT_KEY || null;

      return res.status(200).json({
        message: "Snap token created",
        data: {
          clientKey,
          snapToken: result.snapToken,
          redirectUrl: result.redirectUrl,
        },
      });
    } catch (e) {
      if (e instanceof AppError) {
        return res.status(e.statusCode).json({ message: e.message });
      }
      const msg = e instanceof Error ? e.message : String(e);
      return res
        .status(500)
        .json({ message: "Failed to create Snap token", error: msg });
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
      if (e instanceof AppError) {
        return res
          .status(e.statusCode)
          .json({ status: "error", message: e.message });
      }
      const msg = e instanceof Error ? e.message : String(e);
      return res.status(400).json({ status: "error", message: msg });
    }
  };
}

export const paymentController = new PaymentController();
