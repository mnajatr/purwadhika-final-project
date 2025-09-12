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

/**
 * Order Service - Main facade for order operations
 * Orchestrates order operations using specialized services:
 * - CheckoutService: Handles order creation and checkout logic
 * - FulfillmentService: Manages order status transitions
 * - OrderReadService: Handles order listing and retrieval
 * - PaymentService: Manages payment-related operations
 */
export class OrderService {
  /**
   * Create a new order through checkout
   * @param userId - User creating the order
   * @param storeId - Optional explicit store ID
   * @param items - Order items array
   * @param idempotencyKey - Optional idempotency key for duplicate prevention
   * @param userLat - Optional user latitude
   * @param userLon - Optional user longitude
   * @param addressId - Optional address ID
   * @returns Created order with items
   */
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

  /**
   * Ship an order and schedule auto-confirmation
   * @param orderId - Order ID to ship
   * @param actorUserId - User performing the action
   * @returns Updated order
   */
  async shipOrder(orderId: number, actorUserId?: number) {
    return fulfillmentService.shipOrder(orderId, actorUserId);
  }

  /**
   * Confirm order delivery manually
   * @param orderId - Order ID to confirm
   * @param requesterUserId - User requesting confirmation (must be order owner)
   * @returns Updated order
   */
  async confirmOrder(orderId: number, requesterUserId?: number) {
    return fulfillmentService.confirmOrder(orderId, requesterUserId);
  }

  /**
   * Cancel an order and restore inventory
   * @param orderId - Order ID to cancel
   * @param requesterUserId - User requesting cancellation (must be order owner)
   * @returns Updated order
   */
  async cancelOrder(orderId: number, requesterUserId: number) {
    return fulfillmentService.cancelOrder(orderId, requesterUserId);
  }

  /**
   * List orders with optional filters and pagination
   * @param options - Filter and pagination options
   * @returns Paginated order list with totals
   */
  async listOrders(opts: {
    userId?: number;
    status?: string;
    q?: string | number;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
  }) {
    return orderReadService.listOrders(opts);
  }

  /**
   * Upload payment proof for an order
   * @param orderId - Order ID
   * @param fileBuffer - File buffer
   * @param mime - MIME type
   * @returns Upload result with proof URL and payment info
   */
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

  /**
   * Get order counts by status for a user
   * @param userId - User ID to get counts for
   * @returns Object with counts for each status
   */
  async getOrderCountsByStatus(userId: number) {
    return orderReadService.getOrderCountsByStatus(userId);
  }
}
