import { checkoutService } from "./checkout.service.js";
import { fulfillmentService } from "./fulfillment.service.js";
import { orderReadService } from "./order.read.service.js";
import { paymentService } from "./payment.service.js";

type OrderItemInput = { productId: number; qty: number };

type PaymentMinimal = {
  id: number;
  orderId: number;
  status: string;
  proofImageUrl?: string | null;
  amount: number | null;
};

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
    return checkoutService.createCheckout(
      userId,
      storeId,
      items,
      idempotencyKey,
      userLat,
      userLon,
      addressId
    );
  }

  async shipOrder(orderId: number, actorUserId?: number) {
    return fulfillmentService.shipOrder(orderId, actorUserId);
  }

  async confirmOrder(orderId: number, requesterUserId?: number) {
    return fulfillmentService.confirmOrder(orderId, requesterUserId);
  }

  async cancelOrder(orderId: number, requesterUserId: number) {
    return fulfillmentService.cancelOrder(orderId, requesterUserId);
  }

  async listOrders(opts: {
  storeId?: number;
  userId?: number;
    status?: string;
    q?: string | number;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
  }) {
  return orderReadService.listOrders(opts as any);
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
    return paymentService.uploadPaymentProof(orderId, fileBuffer, mime);
  }

  async getOrderCountsByStatus(userId: number) {
    return orderReadService.getOrderCountsByStatus(userId);
  }
}
