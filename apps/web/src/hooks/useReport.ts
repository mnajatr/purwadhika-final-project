"use client";

import { useQuery } from "@tanstack/react-query";
import { reportService } from "@/services/report.service";
import {
  SalesByCategoryItem,
  SalesByProductItem,
  SalesReportItem,
  StockDetailItem,
  StockSummaryItem,
} from "@/types/report.type";

interface ReportParams {
  month: number;
  year: number;
  storeId?: number;
}

const isValidParams = (params: ReportParams) =>
  typeof params.month === "number" && typeof params.year === "number";

export function useSales(params: ReportParams) {
  return useQuery<SalesReportItem[], Error>({
    queryKey: ["sales", params.month, params.year, params.storeId],
    queryFn: () => reportService.getSales(params),
    enabled: isValidParams(params),
  });
}

export function useSalesByCategory(params: ReportParams) {
  return useQuery<SalesByCategoryItem[], Error>({
    queryKey: ["salesByCategory", params.month, params.year, params.storeId],
    queryFn: () => reportService.getSalesByCategory(params),
    enabled: isValidParams(params),
  });
}

export function useSalesByProduct(params: ReportParams) {
  return useQuery<SalesByProductItem[], Error>({
    queryKey: ["salesByProduct", params.month, params.year, params.storeId],
    queryFn: () => reportService.getSalesByProduct(params),
    enabled: isValidParams(params),
  });
}

export function useStockSummary(params: ReportParams) {
  return useQuery<StockSummaryItem[], Error>({
    queryKey: ["stockSummary", params.month, params.year, params.storeId],
    queryFn: () => reportService.getStockSummary(params),
    enabled: isValidParams(params),
  });
}

export function useStockDetail(params: ReportParams) {
  return useQuery<StockDetailItem[], Error>({
    queryKey: ["stockDetail", params.month, params.year, params.storeId],
    queryFn: () => reportService.getStockDetail(params),
    enabled: isValidParams(params),
  });
}
