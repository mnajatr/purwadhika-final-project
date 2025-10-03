import { prisma } from "@repo/database";
import { locationService } from "./location.service.js";
import { inventoryService } from "./inventory.service.js";
import { addressService } from "./address.service.js";
import { shippingService } from "./shipping.service.js";
import { AppError } from "../errors/app.error.js";

type OrderItemInput = { productId: number; qty: number };

type IdempotencyEntry =
  | { type: "pending"; promise: Promise<any> }
  | { type: "done"; result: any; expiresAt: number };

const IDEMPOTENCY_TTL_MS = 60 * 1000;
const idempotencyStore = new Map<string, IdempotencyEntry>();
const ORDER_CANCEL_DELAY_MS =
  Number(process.env.ORDER_CANCEL_DELAY_MS) || 60 * 60 * 1000;

export class CheckoutService {
  private locationService = locationService;
  private inventoryService = inventoryService;
  private addressService = addressService;
  private shippingService = shippingService;

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

    if (idempotencyKey) {
      idempotencyStore.set(idempotencyKey, { type: "pending", promise: work });
      work
        .then((res) => {
          idempotencyStore.set(idempotencyKey!, {
            type: "done",
            result: res,
            expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
          });
        })
        .catch(() => {
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
      throw new AppError("No items provided", 400);
    }

    const resolvedStoreId = await this.locationService.resolveStoreId(
      storeId,
      userId,
      userLat,
      userLon,
      addressId
    );

    const result = await prisma.$transaction(async (tx) => {
      await this.inventoryService.validateInventoryAvailability(
        resolvedStoreId,
        items
      );

      const chosenAddressId = await this.addressService.resolveAddressId(
        userId,
        addressId
      );
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
          paymentDeadlineAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      // Resolve shipping method and cost using shipping service
      const resolvedMethodId = await this.shippingService.resolveShippingMethod(
        { shippingMethod, shippingOption },
        tx
      );

      const shippingCost = 0; // Default cost (can be enhanced with calculation logic)

      // Create shipment record
      await this.shippingService.createShipment(
        tx,
        createdOrder.id,
        resolvedMethodId,
        shippingCost
      );

      for (const item of items) {
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

      await this.inventoryService.reserveInventory(
        resolvedStoreId,
        createdOrder.id,
        items,
        userId,
        tx
      );

      const grandTotal = subtotal;

      await tx.order.update({
        where: { id: createdOrder.id },
        data: { subtotalAmount: subtotal, grandTotal, totalItems },
      });

      const fullOrder = await tx.order.findUnique({
        where: { id: createdOrder.id },
        include: { items: true },
      });

      return fullOrder;
    });

    if (result?.id) {
      await this._scheduleAutoCancellation(result.id, ORDER_CANCEL_DELAY_MS);
    }

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
      try {
        const logger = (await import("../utils/logger.js")).default;
        logger.error(
          "Failed to clean up cart for user=%d order=%d: %o",
          userId,
          result?.id,
          err
        );
      } catch (e) {
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
      try {
        const logger = (await import("../utils/logger.js")).default;
        logger.error(
          `Failed to enqueue cancel job for order=${orderId}: %o`,
          err
        );
      } catch (e) {
        // Ignore logging errors
      }
    }
  }
}

export const checkoutService = new CheckoutService();
