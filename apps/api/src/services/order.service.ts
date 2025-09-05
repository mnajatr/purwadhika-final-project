import { prisma } from "@repo/database";
import { ERROR_MESSAGES } from "../utils/helpers.js";
type OrderItemInput = { productId: number; qty: number };

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
    storeId: number,
    items: OrderItemInput[],
    idempotencyKey?: string
  ) {
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

    const work = this._createOrderImpl(userId, storeId, items);

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

  private async _createOrderImpl(
    userId: number,
    storeId: number,
    items: OrderItemInput[]
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

      const orderNo = `ORD-${Date.now()}-${Math.floor(Math.random() * 9000)}`;

      const createdOrder = await tx.order.create({
        data: {
          userId,
          storeId,
          orderNo,
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
        const unitPrice = Math.round(Number(inv.price));
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
        await tx.storeInventory.update({
          where: { id: inv.id },
          data: { stockQty: { decrement: it.qty } },
        });
      }

      const grandTotal = subtotal; // shipping/discount omitted in MVP

      const updated = await tx.order.update({
        where: { id: createdOrder.id },
        data: { subtotalAmount: subtotal, grandTotal, totalItems },
      });

      return updated;
    });

    return result;
  }

  // ...existing methods above are preserved
}
