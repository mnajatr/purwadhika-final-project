"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios-client";
import type { ApiResponse } from "@/types/api";
import {
  OrdersListResponseSchema,
  type OrderListItem,
  type OrdersFilter,
} from "@repo/schemas";

interface UseOrdersListParams {
  page: number;
  pageSize: number;
  status: string | null;
  q: string | null;
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
}

interface OrdersListResponse {
  items: OrderListItem[];
  total: number;
  page: number;
  pageSize: number;
}

async function fetchOrdersList(
  filters: OrdersFilter
): Promise<OrdersListResponse> {
  const response = await apiClient.get<ApiResponse<OrdersListResponse>>(
    "/orders",
    filters
  );

  const responseData = response.data || response;

  const parsed = OrdersListResponseSchema.safeParse(responseData);

  if (parsed.success) {
    return {
      items: parsed.data.items || [],
      total: parsed.data.total || 0,
      page: parsed.data.page || filters.page || 1,
      pageSize: parsed.data.pageSize || filters.pageSize || 10,
    };
  }

  if (responseData && typeof responseData === "object") {
    const fallback = responseData as OrdersListResponse;
    return {
      items: fallback.items || [],
      total: fallback.total || 0,
      page: fallback.page || filters.page || 1,
      pageSize: fallback.pageSize || filters.pageSize || 10,
    };
  }

  return {
    items: [],
    total: 0,
    page: filters.page || 1,
    pageSize: filters.pageSize || 10,
  };
}export function useOrdersList({
  page,
  pageSize,
  status,
  q,
  dateRange,
}: UseOrdersListParams) {
  const filters = React.useMemo<OrdersFilter>(() => {
    const params: OrdersFilter = {
      page,
      pageSize,
    };

    if (status) params.status = status;
    if (q) params.q = q;

    if (dateRange.from) {
      const startOfDay = new Date(dateRange.from);
      startOfDay.setHours(0, 0, 0, 0);
      params.dateFrom = startOfDay.toISOString();
    }

    if (dateRange.to) {
      const endOfDay = new Date(dateRange.to);
      endOfDay.setHours(23, 59, 59, 999);
      params.dateTo = endOfDay.toISOString();
    } else if (dateRange.from && !dateRange.to) {
      const endOfDay = new Date(dateRange.from);
      endOfDay.setHours(23, 59, 59, 999);
      params.dateTo = endOfDay.toISOString();
    }

    return params;
  }, [page, pageSize, status, q, dateRange.from, dateRange.to]);

  return useQuery({
    queryKey: [
      "orders-list",
      filters.page,
      filters.status,
      filters.q,
      filters.dateFrom,
      filters.dateTo,
      filters.pageSize,
    ],
    queryFn: () => fetchOrdersList(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
}
