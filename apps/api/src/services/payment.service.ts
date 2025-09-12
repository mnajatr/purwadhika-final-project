import { prisma } from "@repo/database";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { orderCancelQueue } from "../queues/orderCancelQueue.js";
import { createConflictError } from "../errors/app.error.js";

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
    const config = cloudinary.config();
    if (!config.cloud_name || !config.api_key) {
      throw new Error(
        "Cloudinary not configured: missing cloud_name or api_key"
      );
    }

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

    const uploadRes = (await new Promise<UploadApiResponse>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: `orders/${orderId}`, resource_type: "image" },
          (error: Error | undefined, result: UploadApiResponse | undefined) => {
            if (error) return reject(error);
            if (!result) return reject(new Error("Empty upload result"));
            resolve(result);
          }
        );
        stream.end(Buffer.from(fileBuffer));
      }
    )) as UploadApiResponse;

    const proofUrl = uploadRes.secure_url ?? uploadRes.url;

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
