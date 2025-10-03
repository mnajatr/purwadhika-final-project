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
  productName: string;
  totalIn: number;
  totalOut: number;
  endingStock: number;
}

export interface StockDetailItem {
  id: number;
  storeId: number;
  productId: number;
  qtyChange: number;
  reason: StockChangeReasonEnum;
  note: string;
  adminId: number;
  createdAt: string;
  product: {
    name: string;
  };
  admin: {
    email: string;
  };
}
