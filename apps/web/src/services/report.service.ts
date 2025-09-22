import { apiClient } from "@/lib/axios-client";
import {
  SalesByCategoryItem,
  SalesByProductItem,
  SalesReportItem,
  StockDetailItem,
  StockSummaryItem,
} from "@/types/report.type";

class ReportService {
  private readonly basePath = "/reports";

  private buildQuery(params: {
    month: number;
    year: number;
    storeId?: number;
  }) {
    const query: Record<string, number> = {
      month: params.month,
      year: params.year,
    };
    if (params.storeId !== undefined) query.storeId = params.storeId;
    return query;
  }

  async getSales(params: { month: number; year: number; storeId?: number }) {
    const resp = await apiClient["client"].get<{ data: SalesReportItem[] }>(
      `${this.basePath}/sales`,
      { params: this.buildQuery(params) }
    );
    return resp.data.data;
  }

  async getSalesByCategory(params: {
    month: number;
    year: number;
    storeId?: number;
  }) {
    const resp = await apiClient["client"].get<{ data: SalesByCategoryItem[] }>(
      `${this.basePath}/sales/by-category`,
      { params: this.buildQuery(params) }
    );
    return resp.data.data;
  }

  async getSalesByProduct(params: {
    month: number;
    year: number;
    storeId?: number;
  }) {
    const resp = await apiClient["client"].get<{ data: SalesByProductItem[] }>(
      `${this.basePath}/sales/by-product`,
      { params: this.buildQuery(params) }
    );
    return resp.data.data;
  }

  async getStockSummary(params: {
    month: number;
    year: number;
    storeId?: number;
  }) {
    const resp = await apiClient["client"].get<{ data: StockSummaryItem[] }>(
      `${this.basePath}/stock/summary`,
      { params: this.buildQuery(params) }
    );
    return resp.data.data;
  }

  async getStockDetail(params: {
    month: number;
    year: number;
    storeId?: number;
  }) {
    const resp = await apiClient["client"].get<{ data: StockDetailItem[] }>(
      `${this.basePath}/stock/detail`,
      { params: this.buildQuery(params) }
    );
    return resp.data.data;
  }
}

export const reportService = new ReportService();
