import { prisma } from "@repo/database";
import { ERROR_MESSAGES } from "../utils/helpers.js";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { orderCancelQueue } from "../queues/orderCancelQueue.js";
import { createConflictError } from "../errors/app.error.js";
// Default auto-cancel delay: 1 hour in production. Tests can override via
// ORDER_CANCEL_DELAY_MS environment variable (value in milliseconds).
const ORDER_CANCEL_DELAY_MS =
  Number(process.env.ORDER_CANCEL_DELAY_MS) || 60 * 60 * 1000;
type OrderItemInput = { productId: number; qty: number };

type PaymentMinimal = {
  id: number;
  orderId: number;
  status: string;
  proofImageUrl?: string | null;
  amount: number | null;
};

// TODO: This in-memory idempotency store is fine for local development and
// short-lived processes but must be replaced with a durable DB backed table
// (idempotency_keys) for production. The store keeps both in-flight promises
// and recently resolved results for a short TTL so retries after success
// return the same response instead of re-creating resources.
type IdempotencyEntry =
  | { type: "pending"; promise: Promise<any> }
  | { type: "done"; result: any; expiresAt: number };

const IDEMPOTENCY_TTL_MS = 60 * 1000; // keep resolved results for 60s
const idempotencyStore = new Map<string, IdempotencyEntry>();

export class OrderService {
  // Admin/worker: mark order as shipped and schedule auto-confirm job
  async shipOrder(orderId: number, actorUserId?: number) {
    const logger = (await import("../utils/logger.js")).default;
    const allowedPrev = ["PAYMENT_REVIEW", "PROCESSING"];

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new Error("Order not found");

      if (!allowedPrev.includes(order.status))
        throw new Error(`Cannot ship order: current status is ${order.status}`);

      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: "SHIPPED" },
      });

      return updated;
    });

    // Enqueue confirm job with delay (default 48 hours)
    try {
      const { orderConfirmQueue } = await import(
        "../queues/orderConfirmQueue.js"
      );
      const DELAY_MS =
        Number(process.env.ORDER_CONFIRM_DELAY_MS) || 48 * 60 * 60 * 1000;
      await orderConfirmQueue.add(
        "confirm-order",
        { orderId },
        { jobId: String(orderId), delay: DELAY_MS }
      );
    } catch (e) {
      try {
        logger.error(
          `Failed to enqueue confirm job for order=${orderId}: %o`,
          e
        );
      } catch (ee) {
        // swallow
      }
    }

    logger.info(
      `Order ${orderId} marked SHIPPED by user=${actorUserId ?? "system"}`
    );
    return result;
  }
  // Manual confirmation: only owner may confirm receipt when status is SHIPPED
  async confirmOrder(orderId: number, requesterUserId?: number) {
    const logger = (await import("../utils/logger.js")).default;

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new Error("Order not found");

      // If requesterUserId provided, enforce ownership in production
      if (requesterUserId && order.userId !== requesterUserId)
        throw new Error("Cannot confirm: not order owner");

      if (order.status !== "SHIPPED")
        throw new Error(
          `Cannot confirm order: current status is ${order.status}`
        );

      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: "CONFIRMED" },
      });
      return updated;
    });

    // If there was a scheduled confirm job, remove it
    try {
      const { orderConfirmQueue } = await import(
        "../queues/orderConfirmQueue.js"
      );
      const job = await orderConfirmQueue.getJob(String(orderId));
      if (job) await job.remove();
    } catch (e) {
      try {
        logger.error(
          `Failed to remove confirm job for order=${orderId}: %o`,
          e
        );
      } catch (ee) {
        // swallow
      }
    }

    logger.info(
      `Order ${orderId} confirmed by user=${requesterUserId ?? "system"}`
    );
    return result;
  }
  // Manual cancellation endpoint: only owner may cancel and only when still pending payment.
  async cancelOrder(orderId: number, requesterUserId: number) {
    // Re-validate and perform rollback inside a transaction
    const logger = (await import("../utils/logger.js")).default;

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true, payment: true },
      });

      if (!order) throw new Error("Order not found");

      if (order.userId !== requesterUserId)
        throw new Error("Cannot cancel: not order owner");

      if (order.status !== "PENDING_PAYMENT")
        throw createConflictError(
          `Cannot cancel order: current status is ${order.status}`
        );

      // Restore stock and create stock journal entries
      for (const item of order.items) {
        await tx.storeInventory.updateMany({
          where: { storeId: order.storeId, productId: item.productId },
          data: { stockQty: { increment: item.qty } },
        });

        await tx.stockJournal.create({
          data: {
            storeId: order.storeId,
            productId: item.productId,
            qtyChange: item.qty,
            reason: "ADD",
            adminId: order.userId,
          },
        });
      }

      // Rollback vouchers/coupons if schema tracks them: attempt to find
      // vouchers that were marked used by this user around the order creation
      // time and mark them unused again. This is best-effort and scoped to a
      // small time window to avoid affecting unrelated voucher usage.
      try {
        if (order.createdAt) {
          const windowMs = 10 * 60 * 1000; // 10 minutes window
          const from = new Date(order.createdAt.getTime() - windowMs);
          const to = new Date(order.createdAt.getTime() + windowMs);

          const usedVouchers = await tx.voucher.findMany({
            where: {
              userId: order.userId,
              isUsed: true,
              usedAt: { gte: from, lte: to },
            },
          });

          if (usedVouchers.length > 0) {
            await tx.voucher.updateMany({
              where: { id: { in: usedVouchers.map((v) => v.id) } },
              data: { isUsed: false, usedAt: null },
            });
            try {
              logger.info(
                `\[TX\] Rolled back ${usedVouchers.length} voucher(s) for order=${orderId}`
              );
            } catch (ee) {
              // swallow logging errors
            }
          }
        }
      } catch (e) {
        // swallow voucher rollback errors to avoid failing the whole TX for
        // unexpected schema differences; log the error for later debugging.
        try {
          const loggerV = (await import("../utils/logger.js")).default;
          loggerV.warn(`Voucher rollback skipped for order=${orderId}: %o`, e);
        } catch (ee) {
          // swallow
        }
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });

      return updated;
    });

    // Remove any scheduled auto-cancel job for this order
    try {
      const job = await orderCancelQueue.getJob(String(orderId));
      if (job) await job.remove();
    } catch (err) {
      try {
        const logger2 = (await import("../utils/logger.js")).default;
        logger2.error(
          `Failed to remove cancel job for order=${orderId}: %o`,
          err
        );
      } catch (e) {
        // swallow
      }
    }

    logger.info(
      `Order ${orderId} cancelled manually by user=${requesterUserId}`
    );
    return result;
  }
  async createOrder(
    userId: number,
    storeId: number | undefined,
    items: OrderItemInput[],
    idempotencyKey?: string,
    userLat?: number,
    userLon?: number,
    addressId?: number
  ): Promise<any> {
    // entry logged at controller level; avoid noisy console output in service

    if (idempotencyKey) {
      const entry = idempotencyStore.get(idempotencyKey);
      if (entry) {
        if (entry.type === "pending") return entry.promise;
        if (entry.type === "done") {
          // if result still fresh, return it
          if (Date.now() < entry.expiresAt)
            return Promise.resolve(entry.result);
          // expired -> delete and continue
          idempotencyStore.delete(idempotencyKey);
        }
      }
    }

    const work: Promise<any> = (async () => {
      // if storeId is not provided, attempt to compute nearest store.
      // Resolution priority:
      // 1) Explicit coordinates passed in request (userLat/userLon).
      //    If provided and no store is within radius -> throw NO_NEARBY.
      // 2) Address coordinates for provided addressId (if coords not passed).
      // 3) User's primary address (only if coords and addressId not provided).
      let resolvedStoreId = storeId;
      const coordsExplicit =
        typeof userLat === "number" && typeof userLon === "number";

      if (!resolvedStoreId) {
        if (coordsExplicit) {
          // If user explicitly provided coords, only use them. If no store is
          // within MAX_STORE_RADIUS_KM, surface NO_NEARBY instead of falling
          // back to a different address.
          resolvedStoreId = await this._findNearestStoreId(userLat!, userLon!);
          if (!resolvedStoreId) {
            throw new Error(ERROR_MESSAGES.STORE.NO_NEARBY);
          }
        } else {
          // No explicit coords: try addressId coords first
          if (typeof addressId === "number") {
            const addr = await prisma.userAddress.findUnique({
              where: { id: addressId },
            });
            if (addr && addr.latitude && addr.longitude) {
              resolvedStoreId = await this._findNearestStoreId(
                Number(addr.latitude),
                Number(addr.longitude)
              );
            }
          }

          // Finally try user's primary address if still not resolved
          if (!resolvedStoreId) {
            const addr = await prisma.userAddress.findFirst({
              where: { userId },
            });
            if (addr && addr.latitude && addr.longitude) {
              resolvedStoreId = await this._findNearestStoreId(
                Number(addr.latitude),
                Number(addr.longitude)
              );
            }
          }

          if (!resolvedStoreId) {
            throw new Error(ERROR_MESSAGES.STORE.NO_NEARBY);
          }
        }
      }

      // resolvedStoreId is guaranteed to exist here, cast to number for clarity
      return this._createOrderImpl(
        userId,
        resolvedStoreId as number,
        items,
        addressId
      );
    })();

    if (idempotencyKey) {
      // store the in-flight promise
      idempotencyStore.set(idempotencyKey, { type: "pending", promise: work });
      work
        .then((res) => {
          // store resolved result for short TTL
          idempotencyStore.set(idempotencyKey!, {
            type: "done",
            result: res,
            expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
          });
        })
        .catch(() => {
          // on failure remove entry so future retries can attempt again
          idempotencyStore.delete(idempotencyKey!);
        });
    }

    return work;
  }

  // Find nearest storeId given latitude and longitude, or undefined if none.
  private async _findNearestStoreId(
    lat: number,
    lon: number
  ): Promise<number | undefined> {
    // Haversine formula constants
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371; // Earth radius in km

    // load all store locations (small number expected) and compute distance
    const locations = await prisma.storeLocation.findMany({
      include: { store: true },
    });
    if (!locations || locations.length === 0) return undefined;

    let best: { storeId: number; distKm: number } | null = null;
    for (const loc of locations) {
      const dLat = toRad(Number(loc.latitude) - lat);
      const dLon = toRad(Number(loc.longitude) - lon);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat)) *
          Math.cos(toRad(Number(loc.latitude))) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distKm = R * c;

      if (!best || distKm < best.distKm)
        best = { storeId: loc.storeId, distKm };
    }

    // enforce a max service radius (e.g., 50 km) to avoid assigning very distant store
    const MAX_KM = Number(process.env.MAX_STORE_RADIUS_KM ?? 50);
    if (best && best.distKm <= MAX_KM) return best.storeId;
    return undefined;
  }

  private async _createOrderImpl(
    userId: number,
    storeId: number,
    items: OrderItemInput[],
    addressId?: number
  ) {
    if (!items || items.length === 0) throw new Error("No items provided");

    // Basic product existence check and gather inventory rows
    const productIds = items.map((i) => i.productId);

    // Run a transaction: re-check inventory and create order atomically

    const result = await prisma.$transaction(async (tx) => {
      // lock inventories for update by reading them
      const inventories = await tx.storeInventory.findMany({
        where: { storeId, productId: { in: productIds } },
      });

      // ensure all requested products have inventory
      for (const it of items) {
        const inv = inventories.find((i) => i.productId === it.productId);
        if (!inv) throw new Error(ERROR_MESSAGES.INVENTORY.NO_INVENTORY);
        if (inv.stockQty < it.qty)
          throw new Error(
            `${ERROR_MESSAGES.INVENTORY.INSUFFICIENT_STOCK}. Available: ${inv.stockQty}`
          );
      }

      // compute totals and create order
      // For simplicity use product.price from inventory.price
      let subtotal = 0;
      let totalItems = 0;

      // determine address for the order (schema requires addressId)
      let chosenAddressId = addressId;
      if (typeof chosenAddressId !== "number") {
        // pick user's primary or first address; if none exist, auto-create a
        // lightweight placeholder so DB constraints are satisfied.
        const addr = await tx.userAddress.findFirst({ where: { userId } });
        if (addr) chosenAddressId = addr.id;
        else {
          const createdAddr = await tx.userAddress.create({
            data: {
              userId,
              recipientName: "Default Recipient",
              addressLine: "Auto-created address",
              province: "Unknown",
              city: "Unknown",
              district: null,
              postalCode: "00000",
              latitude: 0,
              longitude: 0,
            },
          });
          chosenAddressId = createdAddr.id;
        }
      } else {
        // validate ownership: ensure the provided address belongs to the user
        const addr = await tx.userAddress.findUnique({
          where: { id: chosenAddressId },
        });
        if (!addr || addr.userId !== userId) {
          throw new Error("Address not found or does not belong to user");
        }
      }

      const createdOrder = await tx.order.create({
        data: {
          userId,
          storeId,
          addressId: chosenAddressId,
          status: "PENDING_PAYMENT",
          paymentMethod: "MANUAL_TRANSFER",
          subtotalAmount: 0,
          shippingCost: 0,
          discountTotal: 0,
          grandTotal: 0,
          totalItems: 0,
          paymentDeadlineAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      // create order items and decrement inventory
      for (const it of items) {
        const inv = inventories.find((i) => i.productId === it.productId)!;
        // fetch product price within transaction to capture current product.price
        const product = await tx.product.findUnique({
          where: { id: it.productId },
        });
        const unitPrice = Math.round(Number(product?.price ?? 0));
        const totalAmount = unitPrice * it.qty;

        subtotal += totalAmount;
        totalItems += it.qty;

        await tx.orderItem.create({
          data: {
            orderId: createdOrder.id,
            productId: it.productId,
            productSnapshot: JSON.stringify({ productId: it.productId }),
            unitPriceSnapshot: unitPrice,
            qty: it.qty,
            totalAmount,
          },
        });

        // decrement stock
        // perform conditional atomic decrement to avoid oversell
        const updateRes = await tx.storeInventory.updateMany({
          where: { id: inv.id, stockQty: { gte: it.qty } },
          data: { stockQty: { decrement: it.qty } },
        });

        if (updateRes.count === 0) {
          // some item has insufficient stock, abort transaction
          throw new Error(
            `${ERROR_MESSAGES.INVENTORY.INSUFFICIENT_STOCK}. Available: ${inv.stockQty}`
          );
        }

        // record stock journal for the decrement
        await tx.stockJournal.create({
          data: {
            storeId: inv.storeId,
            productId: inv.productId,
            qtyChange: -it.qty,
            reason: "REMOVE",
            adminId: userId,
          },
        });
      }

      const grandTotal = subtotal; // shipping/discount omitted in MVP

      await tx.order.update({
        where: { id: createdOrder.id },
        data: { subtotalAmount: subtotal, grandTotal, totalItems },
      });

      // return the created order including its items so callers can know
      // which items were actually persisted and act accordingly (e.g., clear
      // matching cart items on the client).
      const full = await tx.order.findUnique({
        where: { id: createdOrder.id },
        include: { items: true },
      });

      return full;
    });

    // Enqueue a cancellation job OUTSIDE the transaction to avoid long transactions holding locks.
    // The queue worker will re-verify order status before cancelling.
    if (!result || !result.id) {
      return result;
    }

    try {
      // attempt enqueue
      // Use a stable jobId (stringified order id) so the job can be
      // retrieved/removed later with queue.getJob(jobId) / job.remove().
      const job = await orderCancelQueue.add(
        "cancel-order",
        { orderId: result.id },
        { jobId: String(result.id), delay: ORDER_CANCEL_DELAY_MS }
      );
      // success (logged via logger in calling context if needed)
    } catch (err) {
      // don't fail order creation due to queue issues; log error
      // use logger to keep consistent structured logs
      try {
        const logger = (await import("../utils/logger.js")).default;
        logger.error(
          `Failed to enqueue cancel job for order=${result.id}: %o`,
          err
        );
      } catch (e) {
        // swallow: enqueue failure should not surface to client and
        // logger import already attempted above. Avoid noisy console output.
      }
      // Don't fail the order creation, just log the error
    }

    return result;
  }

  // ...existing methods above are preserved

  // List orders with optional filters (userId, status, q (order id), dateFrom/dateTo, pagination)
  async listOrders(opts: {
    userId?: number;
    status?: string;
    q?: string | number;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
  }) {
    const {
      userId,
      status,
      q,
      dateFrom,
      dateTo,
      page = 1,
      pageSize = 20,
    } = opts || {};

    const where: any = {};

    // Filter by userId if provided
    if (typeof userId === "number") where.userId = userId;

    // Filter by status if provided
    if (status && status.trim() !== "") where.status = status.trim();

    // Filter by order ID or search in order items if provided
    if (q) {
      const qTrimmed = String(q).trim();
      const qn = Number(qTrimmed);

      if (!Number.isNaN(qn) && qn > 0) {
        // If it's a valid number, search by order ID
        where.id = qn;
      } else if (qTrimmed !== "") {
        // If it's text, search in product names within order items
        where.items = {
          some: {
            product: {
              name: {
                contains: qTrimmed,
                mode: "insensitive",
              },
            },
          },
        };
      }
    }

    // Filter by date range if provided
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        try {
          where.createdAt.gte = new Date(dateFrom);
        } catch (e) {
          // ignore invalid dateFrom
        }
      }
      if (dateTo) {
        try {
          where.createdAt.lte = new Date(dateTo);
        } catch (e) {
          // ignore invalid dateTo
        }
      }
    }

    const take = Math.min(100, Math.max(1, pageSize));
    const skip = Math.max(0, (Math.max(1, page) - 1) * take);

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, price: true } },
            },
          },
          payment: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.order.count({ where }),
    ]);

    return { items, total, page, pageSize: take };
  }

  async uploadPaymentProof(
    orderId: number,
    fileBuffer: Buffer | Uint8Array,
    mime: string
  ): Promise<{
    proofUrl: string;
    payment: PaymentMinimal | null;
    orderStatus: string;
  }> {
    // Delegate to payment service to keep single responsibility
    const { paymentService } = await import("./payment.service.js");
    return paymentService.uploadPaymentProof(orderId, fileBuffer, mime);
  }

  async getOrderCountsByStatus(userId: number) {
    const logger = (await import("../utils/logger.js")).default;
    logger.info(`Getting order counts by status for userId: ${userId}`);

    // Get all orders for the user
    const orders = await prisma.order.findMany({
      where: { userId },
      select: { status: true },
    });

    // Count by status
    const counts: Record<string, number> = {
      ALL: orders.length,
      PENDING_PAYMENT: 0,
      PAYMENT_REVIEW: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      CONFIRMED: 0,
      CANCELLED: 0,
    };

    // Count each status
    for (const order of orders) {
      if (counts[order.status] !== undefined) {
        counts[order.status]++;
      }
    }

    logger.info(`Order counts calculated:`, counts);
    return counts;
  }
}
