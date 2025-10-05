"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminOrders } from "@/services/adminOrders.service";
import type {
  AdminOrdersFilter,
  AdminOrderListItem,
  AdminOrdersListResponse,
} from "@repo/schemas";

type UseOrdersResult = {
  items: AdminOrderListItem[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  meta: {
    total: number;
    page: number;
    pageSize: number;
  };
};

export function useOrders(opts?: AdminOrdersFilter): UseOrdersResult {
  const queryKey = [
    "admin",
    "orders",
    opts?.page ?? 1,
    opts?.pageSize ?? 10,
    opts?.status ?? null,
    opts?.q ?? null,
    opts?.storeId ?? null,
    opts?.from ?? null,
    opts?.to ?? null,
  ];

  const result = useQuery<AdminOrdersListResponse, Error>({
    queryKey,
    queryFn: async () => {
      const data = await getAdminOrders({
        page: opts?.page ?? 1,
        pageSize: opts?.pageSize ?? 10,
        status: opts?.status,
        q: opts?.q,
        storeId: opts?.storeId,
        from: opts?.from,
        to: opts?.to,
      });
      return data;
    },
  });

  return {
    items: result.data?.items ?? [],
    loading: result.isLoading,
    error: result.error?.message ?? null,
    reload: () => result.refetch(),
    meta: {
      total: result.data?.total ?? 0,
      page: result.data?.page ?? 1,
      pageSize: result.data?.pageSize ?? 10,
    },
  };
}
