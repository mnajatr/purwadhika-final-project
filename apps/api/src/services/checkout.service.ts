import { prisma } from "../configs/prisma.config.js";
import { locationService } from "./location.service.js";
import { inventoryService } from "./inventory.service.js";
import { addressService } from "./address.service.js";
import { shippingService } from "./shipping.service.js";
import { AppError } from "../errors/app.error.js";
import logger from "../utils/logger.js";

type OrderItemInput = { productId: number; qty: number };

type IdempotencyEntry =
  | { type: "pending"; promise: Promise<any> }
  | { type: "done"; result: any; expiresAt: number };

const IDEMPOTENCY_TTL_MS = 60 * 1000;
const idempotencyStore = new Map<string, IdempotencyEntry>();
const ORDER_CANCEL_DELAY_MS =
  Number(process.env.ORDER_CANCEL_DELAY_MS) || 100000;

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

    const [resolvedStoreId, chosenAddressId] = await Promise.all([
      this.locationService.resolveStoreId(
        storeId,
        userId,
        userLat,
        userLon,
        addressId
      ),
      this.addressService.resolveAddressId(userId, addressId),
    ]);

    const productIds = items.map((item) => item.productId);
    const [products, inventories] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, price: true },
      }),
      prisma.storeInventory.findMany({
        where: { storeId: resolvedStoreId, productId: { in: productIds } },
      }),
    ]);

    const inventoryMap = new Map(
      inventories.map((inv) => [inv.productId, inv])
    );
    for (const item of items) {
      const inventory = inventoryMap.get(item.productId);
      if (!inventory) {
        throw new AppError("Product not available in this store", 400);
      }
      if (inventory.stockQty < item.qty) {
        throw new AppError(
          `Insufficient stock. Available: ${inventory.stockQty}`,
          400
        );
      }
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    let subtotal = 0;
    let totalItems = 0;
    const orderItemsData = [];
    const stockJournalData = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      const unitPrice = Math.round(Number(product?.price ?? 0));
      const totalAmount = unitPrice * item.qty;

      subtotal += totalAmount;
      totalItems += item.qty;

      orderItemsData.push({
        productId: item.productId,
        productSnapshot: JSON.stringify({ productId: item.productId }),
        unitPriceSnapshot: unitPrice,
        qty: item.qty,
        totalAmount,
      });

      const inventory = inventoryMap.get(item.productId);
      if (inventory) {
        stockJournalData.push({
          storeId: inventory.storeId,
          productId: inventory.productId,
          qtyChange: -item.qty,
          reason: "REMOVE",
          adminId: userId,
        });
      }
    }

    const shippingCost = 0;
    const grandTotal = subtotal;

    const result = await prisma.$transaction(
      async (tx) => {
        const resolvedMethodId =
          await this.shippingService.resolveShippingMethod(
            { shippingMethod, shippingOption },
            tx
          );

        const createdOrder = await tx.order.create({
          data: {
            userId,
            storeId: resolvedStoreId,
            addressId: chosenAddressId,
            status: "PENDING_PAYMENT",
            paymentMethod:
              paymentMethod === "Gateway" ? "GATEWAY" : "MANUAL_TRANSFER",
            subtotalAmount: subtotal,
            shippingCost,
            discountTotal: 0,
            grandTotal,
            totalItems,
            paymentDeadlineAt: new Date(Date.now() + 60 * 60 * 1000),
          },
        });

        await Promise.all([
          tx.shipment.create({
            data: {
              orderId: createdOrder.id,
              methodId: resolvedMethodId,
              trackingNumber: null,
              cost: shippingCost,
              status: "PENDING",
              shippedAt: null,
              deliveredAt: null,
            },
          }),
          tx.orderItem.createMany({
            data: orderItemsData.map((item) => ({
              ...item,
              orderId: createdOrder.id,
            })),
          }),
        ]);

        for (const item of items) {
          const inventory = inventoryMap.get(item.productId);
          if (!inventory) continue;

          const updateRes = await tx.storeInventory.updateMany({
            where: { id: inventory.id, stockQty: { gte: item.qty } },
            data: { stockQty: { decrement: item.qty } },
          });

          if (updateRes.count === 0) {
            throw new AppError(
              `Insufficient stock for product ${item.productId}`,
              400
            );
          }
        }

        await tx.stockJournal.createMany({
          data: stockJournalData,
        });

        return createdOrder;
      },
      {
        maxWait: 5000,
        timeout: 10000,
      }
    );

    Promise.all([
      result?.id
        ? this._scheduleAutoCancellation(result.id, ORDER_CANCEL_DELAY_MS)
        : Promise.resolve(),
      this._cleanupCart(userId, resolvedStoreId, items, result?.id),
    ]).catch((err) => {
      logger.error(`Background tasks failed for order=${result?.id}`, err);
    });

    const fullOrder = await prisma.order.findUnique({
      where: { id: result.id },
      include: { items: true },
    });

    return fullOrder;
  }

  private async _cleanupCart(
    userId: number,
    storeId: number,
    items: OrderItemInput[],
    orderId?: number
  ): Promise<void> {
    try {
      const productIds = items.map((it) => it.productId).filter(Boolean);
      if (productIds.length > 0 && storeId) {
        await prisma.cartItem.deleteMany({
          where: {
            productId: { in: productIds },
            cart: { userId, storeId },
          },
        });
      }
    } catch (err) {
      logger.error(
        `Failed to clean up cart for user=${userId} order=${orderId}`,
        err
      );
    }
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
      logger.error(`Failed to enqueue cancel job for order=${orderId}`, err);
    }
  }
}

export const checkoutService = new CheckoutService();
