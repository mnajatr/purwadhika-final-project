"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminOrders } from "@/services/adminOrders.service";

type ListResp = {
  items: unknown[];
  total: number;
  page: number;
  pageSize: number;
};

export function useOrders(opts?: {
  page?: number;
  pageSize?: number;
  status?: string;
  q?: string;
  storeId?: number;
}) {
  const queryKey = [
    "admin",
    "orders",
    opts?.page ?? 1,
    opts?.pageSize ?? 10,
    opts?.status ?? null,
    opts?.q ?? null,
    opts?.storeId ?? null,
  ];

  const result = useQuery<ListResp, Error>({
    queryKey,
    queryFn: async () => {
      console.log("useOrders calling getAdminOrders with opts:", opts);
      const data = await getAdminOrders({
        page: opts?.page ?? 1,
        pageSize: opts?.pageSize ?? 10,
        status: opts?.status,
        q: opts?.q,
        storeId: opts?.storeId,
      });
      console.log("useOrders received data:", data);
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
