import { prisma } from "@repo/database";
import { OrderStatusEnum, StockChangeReasonEnum } from "../types/report.js";

interface ReportFilter {
  storeId?: number;
  month: number;
  year: number;
}

//SALES REPORT
export async function getSalesReport({ storeId, month, year }: ReportFilter) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const whereCondition: any = {
    createdAt: { gte: startDate, lt: endDate },
    status: { in: [OrderStatusEnum.CONFIRMED, OrderStatusEnum.SHIPPED] },
  };

  if (storeId) whereCondition.storeId = storeId;

  const result = await prisma.order.groupBy({
    by: ["storeId"],
    where: whereCondition,
    _sum: {
      grandTotal: true,
      totalItems: true,
    },
    _count: { id: true },
  });

  return result;
}

export async function getSalesByCategory({
  storeId,
  month,
  year,
}: ReportFilter) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const result = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      order: {
        createdAt: { gte: startDate, lt: endDate },
        status: { in: [OrderStatusEnum.CONFIRMED, OrderStatusEnum.SHIPPED] },
        ...(storeId ? { storeId } : {}),
      },
    },
    _sum: {
      qty: true,
      totalAmount: true,
    },
  });

  const enriched = await Promise.all(
    result.map(async (r) => {
      const product = await prisma.product.findUnique({
        where: { id: r.productId },
        include: { category: true },
      });

      return {
        categoryId: product?.categoryId,
        categoryName: product?.category.name,
        productId: r.productId,
        productName: product?.name,
        totalQty: r._sum.qty ?? 0,
        totalSales: r._sum.totalAmount ?? 0,
      };
    })
  );

  return enriched;
}

export async function getSalesByProduct({
  storeId,
  month,
  year,
}: ReportFilter) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const result = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      order: {
        createdAt: { gte: startDate, lt: endDate },
        status: { in: [OrderStatusEnum.CONFIRMED, OrderStatusEnum.SHIPPED] },
        ...(storeId ? { storeId } : {}),
      },
    },
    _sum: {
      qty: true,
      totalAmount: true,
    },
  });

  const enriched = await Promise.all(
    result.map(async (r) => {
      const product = await prisma.product.findUnique({
        where: { id: r.productId },
        select: { name: true },
      });

      return {
        productId: r.productId,
        productName: product?.name,
        totalQty: r._sum.qty ?? 0,
        totalSales: r._sum.totalAmount ?? 0,
      };
    })
  );

  return enriched;
}

// STOCK REPORT
export async function getStockSummary({ storeId, month, year }: ReportFilter) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const raw = await prisma.stockJournal.groupBy({
    by: ["productId", "reason"],
    where: {
      storeId,
      createdAt: { gte: startDate, lt: endDate },
    },
    _sum: { qtyChange: true },
  });

  const grouped: Record<
    number,
    { totalIn: number; totalOut: number; productName?: string }
  > = {};

  for (const row of raw) {
    if (!grouped[row.productId]) {
      grouped[row.productId] = { totalIn: 0, totalOut: 0 };
    }

    const qty = row._sum.qtyChange ?? 0;

    if (
      [
        StockChangeReasonEnum.ADD,
        StockChangeReasonEnum.RELEASE,
        StockChangeReasonEnum.TRANSFER_IN,
      ].includes(row.reason as StockChangeReasonEnum)
    ) {
      grouped[row.productId].totalIn += qty;
    } else {
      grouped[row.productId].totalOut += qty;
    }
  }

  for (const productId of Object.keys(grouped)) {
    const product = await prisma.product.findUnique({
      where: { id: Number(productId) },
      select: { name: true },
    });
    grouped[Number(productId)].productName = product?.name;
  }

  return Object.entries(grouped).map(([productId, val]) => ({
    productId: Number(productId),
    productName: val.productName,
    totalIn: val.totalIn,
    totalOut: val.totalOut,
    endingStock: val.totalIn - val.totalOut,
  }));
}

export async function getStockDetail({ storeId, month, year }: ReportFilter) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  return await prisma.stockJournal.findMany({
    where: { storeId, createdAt: { gte: startDate, lt: endDate } },
    include: {
      product: { select: { name: true } },
      admin: { select: { email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
