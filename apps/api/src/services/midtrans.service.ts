import { prisma } from "@repo/database";
import { snap } from "../configs/midtrans.config.js";
import crypto from "crypto";

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";

export class MidtransService {
  async createSnapTransaction(orderId: number) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, price: true } },
          },
        },
        payment: true,
      },
    });
    if (!order) throw new Error("Order not found");

    if (order.status !== "PENDING_PAYMENT") {
      throw new Error(
        `Order is not in PENDING_PAYMENT state (current=${order.status})`
      );
    }

    const transactionDetails = {
      order_id: `order-${order.id}-${Date.now()}`,
      gross_amount: order.grandTotal,
    };

    const items = order.items.map((it) => {
      const unitPrice = (() => {
        if (typeof (it as any).unitPriceSnapshot === "number")
          return Number((it as any).unitPriceSnapshot);
        if (typeof (it as any).unitPriceSnapshot === "string")
          return Number((it as any).unitPriceSnapshot);
        try {
          return Number((it as any).unitPriceSnapshot?.toString?.() ?? 0);
        } catch (_) {
          return 0;
        }
      })();

      const price =
        unitPrice ||
        Math.round(
          (Number(order.grandTotal ?? 0) || 0) /
            Math.max(1, order.totalItems || 1)
        );

      return {
        id: String(it.productId),
        price,
        quantity: it.qty,
        name: it.product?.name ?? `product-${it.productId}`,
      };
    });

    const payload: any = {
      transaction_details: transactionDetails,
      item_details: items,
      credit_card: { secure: true },
    };

    // Create or update payment record in DB with gatewayTransactionId (order_id)
    let paymentRecord = order.payment;
    if (paymentRecord) {
      paymentRecord = await prisma.payment.update({
        where: { id: paymentRecord.id },
        data: {
          gatewayTransactionId: transactionDetails.order_id,
          amount: order.grandTotal,
          status: "PENDING",
        },
      });
    } else {
      paymentRecord = await prisma.payment.create({
        data: {
          orderId: order.id,
          gatewayTransactionId: transactionDetails.order_id,
          amount: order.grandTotal,
          status: "PENDING",
        },
      });
    }

    // Use midtrans-client snap.createTransaction
    const result = await snap.createTransaction(payload);

    // snapshot: midtrans-client returns object with token and redirect_url
    return {
      snapToken:
        (result as any).token ?? (result as any).transaction_id ?? null,
      redirectUrl: (result as any).redirect_url ?? null,
      gatewayResponse: result,
      payment: paymentRecord,
    };
  }

  async handleNotification(payload: MidtransNotification) {
    if (!MIDTRANS_SERVER_KEY)
      throw new Error("MIDTRANS_SERVER_KEY not configured");

    const sig = String(payload.signature_key ?? "");
    const orderId = String(payload.order_id ?? "");
    const statusCode = String(payload.status_code ?? "");
    const gross = String(payload.gross_amount ?? "");

    const computed = crypto
      .createHash("sha512")
      .update(orderId + statusCode + gross + MIDTRANS_SERVER_KEY)
      .digest("hex");

    if (sig !== computed) throw new Error("Invalid signature");

    // Find payment by gatewayTransactionId (order_id in our saved record)
    const payment = await prisma.payment.findFirst({
      where: { gatewayTransactionId: orderId },
    });
    if (!payment) throw new Error("Payment record not found");

    if (
      payload.transaction_status === "capture" ||
      payload.transaction_status === "settlement"
    ) {
      // mark paid
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "PAID", paidAt: new Date() },
      });
      // update order status to PROCESSING if currently PENDING_PAYMENT or PAYMENT_REVIEW
      try {
        const order = await prisma.order.findUnique({
          where: { id: payment.orderId },
        });
        if (
          order &&
          (order.status === "PENDING_PAYMENT" ||
            order.status === "PAYMENT_REVIEW")
        ) {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: "PROCESSING" },
          });
        }
      } catch (e) {
        // swallow order update errors
      }
    } else if (
      payload.transaction_status === "deny" ||
      payload.transaction_status === "cancel" ||
      payload.transaction_status === "expire"
    ) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });
      // optionally set order cancelled
      try {
        const order = await prisma.order.findUnique({
          where: { id: payment.orderId },
        });
        if (order && order.status === "PENDING_PAYMENT") {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: "CANCELLED" },
          });
        }
      } catch (e) {}
    }

    return { ok: true };
  }
}

export const midtransService = new MidtransService();

// Notification handling
export interface MidtransNotification {
  order_id: string;
  status_code?: string;
  fraud_status?: string;
  transaction_status?: string;
  transaction_id?: string;
  gross_amount?: string | number;
  signature_key?: string;
}

MidtransService.prototype.handleNotification = async function (
  payload: MidtransNotification
) {
  if (!MIDTRANS_SERVER_KEY)
    throw new Error("MIDTRANS_SERVER_KEY not configured");

  const sig = String(payload.signature_key ?? "");
  const orderId = String(payload.order_id ?? "");
  const statusCode = String(payload.status_code ?? "");
  const gross = String(payload.gross_amount ?? "");

  const computed = crypto
    .createHash("sha512")
    .update(orderId + statusCode + gross + MIDTRANS_SERVER_KEY)
    .digest("hex");

  if (sig !== computed) throw new Error("Invalid signature");

  // Find payment by gatewayTransactionId (order_id in our saved record)
  const payment = await prisma.payment.findFirst({
    where: { gatewayTransactionId: orderId },
  });
  if (!payment) throw new Error("Payment record not found");

  // Interpret transaction_status
  const txStatus = String(
    payload.transaction_status ?? payload.fraud_status ?? ""
  ).toLowerCase();

  if (
    payload.transaction_status === "capture" ||
    payload.transaction_status === "settlement"
  ) {
    // mark paid
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "PAID", paidAt: new Date() },
    });
    // update order status to PROCESSING if currently PENDING_PAYMENT or PAYMENT_REVIEW
    try {
      const order = await prisma.order.findUnique({
        where: { id: payment.orderId },
      });
      if (
        order &&
        (order.status === "PENDING_PAYMENT" ||
          order.status === "PAYMENT_REVIEW")
      ) {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "PROCESSING" },
        });
      }
    } catch (e) {
      // swallow order update errors
    }
  } else if (
    payload.transaction_status === "deny" ||
    payload.transaction_status === "cancel" ||
    payload.transaction_status === "expire"
  ) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });
    // optionally set order cancelled
    try {
      const order = await prisma.order.findUnique({
        where: { id: payment.orderId },
      });
      if (order && order.status === "PENDING_PAYMENT") {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED" },
        });
      }
    } catch (e) {}
  }

  return { ok: true };
};
