import { prisma } from "@repo/database";
import { ERROR_MESSAGES } from "../utils/helpers.js";
import { locationService } from "./location.service.js";
import { inventoryService } from "./inventory.service.js";
import { addressService } from "./address.service.js";

type OrderItemInput = { productId: number; qty: number };

// Idempotency store - replace with DB-backed solution in production
type IdempotencyEntry =
  | { type: "pending"; promise: Promise<any> }
  | { type: "done"; result: any; expiresAt: number };

const IDEMPOTENCY_TTL_MS = 60 * 1000; // keep resolved results for 60s
const idempotencyStore = new Map<string, IdempotencyEntry>();

// Default auto-cancel delay: 1 hour in production
const ORDER_CANCEL_DELAY_MS = Number(process.env.ORDER_CANCEL_DELAY_MS) || 60 * 60 * 1000;

/**
 * Checkout Service - Handles order creation and checkout orchestration
 * Responsible for: idempotency, location resolution, inventory validation,
 * order creation, totals calculation, and auto-cancel scheduling
 */
export class CheckoutService {
  /**
   * Create a new order through checkout process
   * @param userId - User creating the order
   * @param storeId - Optional explicit store ID
   * @param items - Order items array
   * @param idempotencyKey - Optional idempotency key for duplicate prevention
   * @param userLat - Optional user latitude
   * @param userLon - Optional user longitude
   * @param addressId - Optional address ID
   * @returns Created order with items
   */
  async createCheckout(
    userId: number,
    storeId: number | undefined,
    items: OrderItemInput[],
    idempotencyKey?: string,
    userLat?: number,
    userLon?: number,
    addressId?: number
  ): Promise<any> {
    // Handle idempotency
    if (idempotencyKey) {
      const entry = idempotencyStore.get(idempotencyKey);
      if (entry) {
        if (entry.type === "pending") return entry.promise;
        if (entry.type === "done") {
          // If result still fresh, return it
          if (Date.now() < entry.expiresAt) {
            return Promise.resolve(entry.result);
          }
          // Expired -> delete and continue
          idempotencyStore.delete(idempotencyKey);
        }
      }
    }

    const work: Promise<any> = this._createOrderImpl(
      userId,
      storeId,
      items,
      userLat,
      userLon,
      addressId
    );

    // Store work in idempotency cache if key provided
    if (idempotencyKey) {
      idempotencyStore.set(idempotencyKey, { type: "pending", promise: work });
      work
        .then((res) => {
          // Store resolved result for short TTL
          idempotencyStore.set(idempotencyKey!, {
            type: "done",
            result: res,
            expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
          });
        })
        .catch(() => {
          // On failure remove entry so future retries can attempt again
          idempotencyStore.delete(idempotencyKey!);
        });
    }

    return work;
  }

  /**
   * Internal order creation implementation
   * @private
   */
  private async _createOrderImpl(
    userId: number,
    storeId: number | undefined,
    items: OrderItemInput[],
    userLat?: number,
    userLon?: number,
    addressId?: number
  ) {
    if (!items || items.length === 0) {
      throw new Error("No items provided");
    }

    // Resolve store ID based on location
    const resolvedStoreId = await locationService.resolveStoreId(
      storeId,
      userId,
      userLat,
      userLon,
      addressId
    );

    // Create order in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Validate inventory availability
      await inventoryService.validateInventoryAvailability(resolvedStoreId, items);

      // Resolve address for the order
      const chosenAddressId = await addressService.resolveAddressId(userId, addressId);

      // Compute totals and create order
      let subtotal = 0;
      let totalItems = 0;

      const createdOrder = await tx.order.create({
        data: {
          userId,
          storeId: resolvedStoreId,
          addressId: chosenAddressId,
          status: "PENDING_PAYMENT",
          paymentMethod: "MANUAL_TRANSFER",
          subtotalAmount: 0,
          shippingCost: 0,
          discountTotal: 0,
          grandTotal: 0,
          totalItems: 0,
          paymentDeadlineAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      // Create order items and reserve inventory
      for (const item of items) {
        // Fetch product price within transaction to capture current product.price
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });
        
        const unitPrice = Math.round(Number(product?.price ?? 0));
        const totalAmount = unitPrice * item.qty;

        subtotal += totalAmount;
        totalItems += item.qty;

        await tx.orderItem.create({
          data: {
            orderId: createdOrder.id,
            productId: item.productId,
            productSnapshot: JSON.stringify({ productId: item.productId }),
            unitPriceSnapshot: unitPrice,
            qty: item.qty,
            totalAmount,
          },
        });
      }

      // Reserve inventory for all items
      await inventoryService.reserveInventory(
        resolvedStoreId,
        createdOrder.id,
        items,
        userId,
        tx
      );

      const grandTotal = subtotal; // shipping/discount omitted in MVP

      // Update order with calculated totals
      await tx.order.update({
        where: { id: createdOrder.id },
        data: { subtotalAmount: subtotal, grandTotal, totalItems },
      });

      // Return the created order including its items
      const fullOrder = await tx.order.findUnique({
        where: { id: createdOrder.id },
        include: { items: true },
      });

      return fullOrder;
    });

    // Schedule auto-cancellation outside the transaction
    if (result?.id) {
      await this._scheduleAutoCancellation(result.id, ORDER_CANCEL_DELAY_MS);
    }

    return result;
  }

  /**
   * Schedule automatic order cancellation
   * @private
   */
  private async _scheduleAutoCancellation(orderId: number, delayMs: number): Promise<void> {
    try {
      const { orderCancelQueue } = await import("../queues/orderCancelQueue.js");
      
      await orderCancelQueue.add(
        "cancel-order",
        { orderId },
        { jobId: String(orderId), delay: delayMs }
      );
    } catch (err) {
      // Don't fail order creation due to queue issues; log error
      try {
        const logger = (await import("../utils/logger.js")).default;
        logger.error(`Failed to enqueue cancel job for order=${orderId}: %o`, err);
      } catch (e) {
        // swallow logging errors
      }
    }
  }
}

export const checkoutService = new CheckoutService();
