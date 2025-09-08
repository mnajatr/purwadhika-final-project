import { prisma } from "@repo/database";
import { ERROR_MESSAGES } from "../utils/helpers.js";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
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
  async createOrder(
    userId: number,
    storeId: number | undefined,
    items: OrderItemInput[],
    idempotencyKey?: string,
    userLat?: number,
    userLon?: number,
    addressId?: number
  ): Promise<any> {
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
  return this._createOrderImpl(userId, resolvedStoreId as number, items, addressId);
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

    return result;
  }

  // ...existing methods above are preserved

  async uploadPaymentProof(
    orderId: number,
    base64Data: string,
    mime: string
  ): Promise<{ proofUrl: string; payment: PaymentMinimal | null; orderStatus: string }> {
    // Upload base64 image to Cloudinary and persist proofImageUrl
    // Cloudinary should already be configured at app startup
    
    // Sanity check: ensure cloudinary has credentials available before upload
    const config = cloudinary.config();
    if (!config.cloud_name || !config.api_key) {
      throw new Error("Cloudinary not configured: missing cloud_name or api_key");
    }

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
    if (!order) throw new Error("Order not found");

  // upload via upload_stream wrapped as promise
  const uploadRes = (await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `orders/${orderId}` },
        (error: Error | undefined, result: UploadApiResponse | undefined) => {
          if (error) return reject(error);
          if (!result) return reject(new Error("Empty upload result"));
          resolve(result);
        }
      );
      // write buffer
      const buffer = Buffer.from(base64Data, "base64");
      stream.end(buffer);
    })) as UploadApiResponse;

    const proofUrl = uploadRes.secure_url ?? uploadRes.url;

    let paymentRecord: PaymentMinimal | null = null;

    if (order.payment) {
      paymentRecord = await prisma.payment.update({
        where: { id: order.payment.id },
        data: { proofImageUrl: proofUrl, status: "PENDING" },
      }) as unknown as PaymentMinimal;
    } else {
      paymentRecord = await prisma.payment.create({
        data: {
          orderId: order.id,
          status: "PENDING",
          amount: Math.round(Number(order.grandTotal ?? 0)),
          proofImageUrl: proofUrl,
        },
      }) as unknown as PaymentMinimal;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status: "PAYMENT_REVIEW" },
      select: { status: true },
    });

    return { proofUrl, payment: paymentRecord, orderStatus: updatedOrder.status };
  }
}
