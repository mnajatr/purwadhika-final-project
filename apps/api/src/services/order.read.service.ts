import { prisma } from "@repo/database";
import { paginate, formatPagination } from "../utils/pagination.js";

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

export class OrderReadService {
  async listOrders(options: OrderListOptions = {}): Promise<any> {
    const { storeId, userId, status, q, dateFrom, dateTo } = options;

    const { take, skip, page, pageSize } = paginate({
      page: options.page,
      pageSize: options.pageSize,
      max: 100,
    });

    // Defensive: ensure skip/take are valid integers. If invalid, fall back to safe values
    let safeTake = Number.isFinite(Number(take))
      ? Math.max(1, Math.floor(Number(take)))
      : Math.max(1, Number(pageSize ?? 20));
    let safeSkip = Number.isFinite(Number(skip))
      ? Math.max(0, Math.floor(Number(skip)))
      : 0;

    // Log pagination to help diagnose cases where the client/server disagree
    try {
      const logger = (await import("../utils/logger.js")).default;
      logger.info("order.read.service: pagination", {
        take: safeTake,
        skip: safeSkip,
        page,
        pageSize,
      });
    } catch {}

    const where: any = {};
    if (typeof storeId === "number") where.storeId = storeId;
    if (typeof userId === "number") where.userId = userId;
    if (status && status.trim() !== "") where.status = status.trim();

    if (q) {
      const qTrimmed = String(q).trim();
      const qn = Number(qTrimmed);
      if (!Number.isNaN(qn) && qn > 0) {
        where.id = qn;
      } else if (qTrimmed !== "") {
        where.items = {
          some: {
            product: { name: { contains: qTrimmed, mode: "insensitive" } },
          },
        };
      }
    }

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

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  images: {
                    select: {
                      imageUrl: true,
                    },
                  },
                },
              },
            },
          },
          payment: true,
        },
        orderBy: { createdAt: "desc" },
        skip: safeSkip,
        take: safeTake,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      pagination: formatPagination(total, page, pageSize),
    };
  }

  async getOrderById(orderId: number) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: {
                  select: {
                    imageUrl: true,
                  },
                },
              },
            },
          },
        },
        payment: true,
        shipment: true,
        store: {
          select: {
            id: true,
            name: true,
            locations: {
              select: {
                city: true,
                province: true,
                addressLine: true,
              },
              take: 1,
            },
          },
        },
        address: {
          select: {
            recipientName: true,
            addressLine: true,
            city: true,
            province: true,
            postalCode: true,
            // phoneNumber isn't in the schema, but we can add it if needed
          },
        },
      },
    });

    return order;
  }

  async getOrderCountsByStatus(
    userId: number
  ): Promise<Record<string, number>> {
    const logger = (await import("../utils/logger.js")).default;
    logger.info(`Getting order counts by status for userId: ${userId}`);

    const orders = await prisma.order.findMany({
      where: { userId },
      select: { status: true },
    });

    const counts: Record<string, number> = {
      ALL: orders.length,
      PENDING_PAYMENT: 0,
      PAYMENT_REVIEW: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      CONFIRMED: 0,
      CANCELLED: 0,
    };

    for (const order of orders)
      if (counts[order.status] !== undefined) counts[order.status]++;

    logger.info(`Order counts calculated:`, counts);
    return counts;
  }
}

export const orderReadService = new OrderReadService();
