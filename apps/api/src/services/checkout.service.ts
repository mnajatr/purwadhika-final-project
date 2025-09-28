import { prisma } from "@repo/database";
import { ERROR_MESSAGES } from "../utils/helpers.js";
import { locationService } from "./location.service.js";
import { inventoryService } from "./inventory.service.js";
import { addressService } from "./address.service.js";

type OrderItemInput = { productId: number; qty: number };

type IdempotencyEntry =
  | { type: "pending"; promise: Promise<any> }
  | { type: "done"; result: any; expiresAt: number };

const IDEMPOTENCY_TTL_MS = 60 * 1000;
const idempotencyStore = new Map<string, IdempotencyEntry>();
const ORDER_CANCEL_DELAY_MS =
  Number(process.env.ORDER_CANCEL_DELAY_MS) || 60 * 60 * 1000;

export class CheckoutService {
  async createCheckout(
    userId: number,
    storeId: number | undefined,
    items: OrderItemInput[],
    idempotencyKey?: string,
    userLat?: number,
    userLon?: number,
    addressId?: number,
    paymentMethod?: string,
    shippingMethod?: string,
    shippingOption?: string
  ): Promise<any> {
    if (idempotencyKey) {
      const entry = idempotencyStore.get(idempotencyKey);
      if (entry) {
        if (entry.type === "pending") return entry.promise;
        if (entry.type === "done") {
          if (Date.now() < entry.expiresAt) {
            return Promise.resolve(entry.result);
          }
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
      addressId,
      paymentMethod,
      shippingMethod,
      shippingOption
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

  private async _createOrderImpl(
    userId: number,
    storeId: number | undefined,
    items: OrderItemInput[],
    userLat?: number,
    userLon?: number,
    addressId?: number,
    paymentMethod?: string,
    shippingMethod?: string,
    shippingOption?: string
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
      await inventoryService.validateInventoryAvailability(
        resolvedStoreId,
        items
      );

      // Resolve address for the order
      const chosenAddressId = await addressService.resolveAddressId(
        userId,
        addressId
      );

      // Compute totals and create order
      let subtotal = 0;
      let totalItems = 0;

      const createdOrder = await tx.order.create({
        data: {
          userId,
          storeId: resolvedStoreId,
          addressId: chosenAddressId,
          status: "PENDING_PAYMENT",
          paymentMethod:
            paymentMethod === "Gateway" ? "GATEWAY" : "MANUAL_TRANSFER",
          subtotalAmount: 0,
          shippingCost: 0,
          discountTotal: 0,
          grandTotal: 0,
          totalItems: 0,
          paymentDeadlineAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      // Log shipping information for tracking (could be stored in separate shipping table later)
      if (shippingMethod) {
        console.log(
          `Order ${createdOrder.id} - Shipping Method: ${shippingMethod}${
            shippingOption ? ` - ${shippingOption}` : ""
          }`
        );
      }

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

    // After successful order creation, remove the ordered products from the user's cart
    try {
      const productIds = items.map((it: any) => it.productId).filter(Boolean);
      if (productIds.length > 0 && resolvedStoreId) {
        await prisma.cartItem.deleteMany({
          where: {
            productId: { in: productIds },
            cart: { userId, storeId: resolvedStoreId },
          },
        });
      }
    } catch (err) {
      // Don't fail the order if cart cleanup fails; log and continue
      try {
        const logger = (await import("../utils/logger.js")).default;
        logger.error(
          "Failed to clean up cart for user=%d order=%d: %o",
          userId,
          result?.id,
          err
        );
      } catch (e) {
        // fallback
        // eslint-disable-next-line no-console
        console.error(
          "Cart cleanup failed for user=%d order=%d",
          userId,
          result?.id,
          err
        );
      }
    }

    return result;
  }

  private async _scheduleAutoCancellation(
    orderId: number,
    delayMs: number
  ): Promise<void> {
    try {
      const { orderCancelQueue } = await import(
        "../queues/orderCancelQueue.js"
      );

      await orderCancelQueue.add(
        "cancel-order",
        { orderId },
        { jobId: String(orderId), delay: delayMs }
      );
    } catch (err) {
      // Don't fail order creation due to queue issues; log error
      try {
        const logger = (await import("../utils/logger.js")).default;
        logger.error(
          `Failed to enqueue cancel job for order=${orderId}: %o`,
          err
        );
      } catch (e) {
        // swallow logging errors
      }
    }
  }
}

export const checkoutService = new CheckoutService();
