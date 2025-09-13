import { prisma } from "@repo/database";

export interface OrderListOptions {
  storeId?: number;
  userId?: number;
  status?: string;
  q?: string | number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface OrderListResult {
  items: any[];
  total: number;
  page: number;
  pageSize: number;
}

export class OrderReadService {

  async listOrders(options: OrderListOptions): Promise<OrderListResult> {
    const {
      storeId,
      userId,
      status,
      q,
      dateFrom,
      dateTo,
      page = 1,
      pageSize = 20,
    } = options || {};

    const where: any = {};

    // Filter by storeId if provided (admin listing)
    if (typeof storeId === "number") where.storeId = storeId;

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

  async getOrderById(orderId: number) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, price: true },
            },
          },
        },
        payment: true,
        shipment: true,
      },
    });

    return order;
  }

  async getOrderCountsByStatus(userId: number): Promise<Record<string, number>> {
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

  async checkOrderOwnership(orderId: number, userId: number): Promise<boolean> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });

    return order?.userId === userId;
  }
}

export const orderReadService = new OrderReadService();
