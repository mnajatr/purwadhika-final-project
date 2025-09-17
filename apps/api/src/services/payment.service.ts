import { prisma } from "@repo/database";
// cloudinary config and setup are handled centrally in fileService/config; no direct import needed here
import { orderCancelQueue } from "../queues/orderCancelQueue.js";
import { createConflictError } from "../errors/app.error.js";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { fileService } from "./file.service.js";

type PaymentMinimal = {
  id: number;
  orderId: number;
  status: string;
  proofImageUrl?: string | null;
  amount: number | null;
};

export class PaymentService {
  // Uploads payment proof to Cloudinary and updates/creates payment record.
  async uploadPaymentProof(
    orderId: number,
    fileBuffer: Buffer | Uint8Array,
    mime: string
  ): Promise<{
    proofUrl: string;
    payment: PaymentMinimal | null;
    orderStatus: string;
  }> {
    // cloudinary configuration is handled by configs/fileService; assume fileService will surface errors if missing

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });
    if (!order) throw new Error("Order not found");

    if (order.status !== "PENDING_PAYMENT") {
      throw createConflictError(
        `Cannot upload payment proof: order is already ${order.status}`
      );
    }

    // Write buffer to a temp file and upload using shared fileService
    // sanitize mime subtype (e.g. "image/svg+xml" -> "svg")
    let ext = "bin";
    if (mime && mime.includes("/")) {
      const subtype = mime.split("/")[1];
      ext = subtype.split("+")[0].replace(/[^a-z0-9]/gi, "") || "bin";
    }
    const tmpName = `payment-${orderId}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const tmpPath = path.join(os.tmpdir(), tmpName);
    await fs.writeFile(tmpPath, Buffer.from(fileBuffer));

    let proofUrl: string;
    try {
      proofUrl = await fileService.uploadPicture(tmpPath);
    } catch (err) {
      // ensure temp file is removed on error as well
      try { await fs.unlink(tmpPath); } catch (e) { /* ignore */ }
      throw err;
    }

    let paymentRecord: PaymentMinimal | null = null;

    if (order.payment) {
      paymentRecord = (await prisma.payment.update({
        where: { id: order.payment.id },
        data: { proofImageUrl: proofUrl, status: "PENDING" },
      })) as unknown as PaymentMinimal;
    } else {
      paymentRecord = (await prisma.payment.create({
        data: {
          orderId: order.id,
          status: "PENDING",
          amount: Math.round(Number(order.grandTotal ?? 0)),
          proofImageUrl: proofUrl,
        },
      })) as unknown as PaymentMinimal;
    }

    try {
      const job = await orderCancelQueue.getJob(String(order.id));
      if (job) {
        await job.remove();
        try {
          const logger = (await import("../utils/logger.js")).default;
          logger.info(`Removed cancel job for order=${order.id}`);
        } catch (e) {
          // swallow logging errors
        }
      }
    } catch (err) {
      try {
        const logger = (await import("../utils/logger.js")).default;
        logger.error(
          `Failed to remove cancel job for order=${order.id}: %o`,
          err
        );
      } catch (e) {
        // swallow
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status: "PAYMENT_REVIEW" },
      select: { status: true },
    });

    return {
      proofUrl,
      payment: paymentRecord,
      orderStatus: updatedOrder.status,
    };
  }
}

export const paymentService = new PaymentService();
