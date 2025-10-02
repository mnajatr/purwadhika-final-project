// Enums
export enum OrderStatusEnum {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  SHIPPED = "SHIPPED",
  CANCELLED = "CANCELLED",
}

export enum StockChangeReasonEnum {
  ADD = "ADD",
  REMOVE = "REMOVE",
  RELEASE = "RELEASE",
  TRANSFER_IN = "TRANSFER_IN",
  TRANSFER_OUT = "TRANSFER_OUT",
}

// Types
export interface SalesReportItem {
  storeId: number;
  _sum: {
    grandTotal: number;
    totalItems: number;
  };
  _count: {
    id: number;
  };
  status: OrderStatusEnum;
}

export interface SalesByCategoryItem {
  categoryId: number;
  categoryName: string;
  productId: number;
  productName: string;
  totalQty: number;
  totalSales: number;
}

export interface SalesByProductItem {
  productId: number;
  productName: string;
  totalQty: number;
  totalSales: number;
}

export interface StockSummaryItem {
  productId: number;
  _sum: {
    qtyChange: number;
  };
}

export interface StockDetailItem {
  productId: number;
  productName: string;
  stockChanges: Array<{
    qtyChange: number;
    reason: StockChangeReasonEnum;
    date: string;
  }>;
}
