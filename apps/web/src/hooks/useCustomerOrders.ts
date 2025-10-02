import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

interface Order {
  id: number;
  status: string;
  invoiceId: string;
  createdAt: string;
  total: number;
  grandTotal?: number;
  address?: {
    recipientName?: string;
  };
  items?: {
    id: number;
    quantity: number;
    product?: {
      id: number;
      name: string;
      price: number;
      images?: Array<{
        imageUrl: string;
      }>;
    };
  }[];
  orderDetails?: {
    quantity: number;
    product: {
      name: string;
      images?: Array<{
        imageUrl: string;
      }>;
    };
  }[];
}

interface OrdersResponse {
  items: Order[];
  total: number;
  page: number;
  pageSize: number;
}

interface UseCustomerOrdersParams {
  page: number;
  pageSize: number;
  status: string | null;
  q: string | null;
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
}

function getCurrentUserId(): string {
  if (typeof window === "undefined") return "4";

  try {
    const stored = localStorage.getItem("devUserId");
    if (stored && stored !== "none") {
      return stored;
    }
  } catch {
    return "4";
  }

  return "4";
}

async function fetchOrders(
  filters: {
    page?: number;
    pageSize?: number;
    status?: string | null;
    q?: string | null;
    dateFrom?: string;
    dateTo?: string;
  } = {}
): Promise<OrdersResponse> {
  const params = new URLSearchParams();
  
  if (typeof filters.page === "number")
    params.append("page", String(filters.page));
  if (typeof filters.pageSize === "number")
    params.append("pageSize", String(filters.pageSize));
  if (filters.status) params.append("status", filters.status);
  if (filters.q) params.append("q", filters.q);
  if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.append("dateTo", filters.dateTo);

  const currentUserId = getCurrentUserId();
  const url = `http://localhost:8000/api/orders?${params.toString()}`;
  console.log("Fetching orders from:", url, "for user:", currentUserId);

  const response = await fetch(url, {
    headers: {
      "x-dev-user-id": currentUserId,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  console.log("API Response:", data);

  if (data.success && data.data) {
    return data.data;
  }

  return { items: [], total: 0, page: 1, pageSize: filters.pageSize ?? 10 };
}

export function useCustomerOrders({ page, pageSize, status, q, dateRange }: UseCustomerOrdersParams) {
  return useQuery({
    queryKey: ["customer-orders", page, status, q, dateRange.from, dateRange.to],
    queryFn: async () => {
      let dateFrom: string | undefined;
      let dateTo: string | undefined;
      
      if (dateRange.from) {
        const startOfDay = new Date(dateRange.from);
        startOfDay.setHours(0, 0, 0, 0);
        dateFrom = startOfDay.toISOString();
      }
      
      if (dateRange.to) {
        const endOfDay = new Date(dateRange.to);
        endOfDay.setHours(23, 59, 59, 999);
        dateTo = endOfDay.toISOString();
      } else if (dateRange.from && !dateRange.to) {
        const endOfDay = new Date(dateRange.from);
        endOfDay.setHours(23, 59, 59, 999);
        dateTo = endOfDay.toISOString();
      }
      
      if (dateFrom || dateTo) {
        console.log("📅 Date range filter:", {
          from: dateRange.from ? format(dateRange.from, "PPP") : "Not set",
          to: dateRange.to ? format(dateRange.to, "PPP") : "Not set",
          dateFrom,
          dateTo,
        });
      }
      
      return fetchOrders({
        page,
        pageSize,
        status,
        q,
        dateFrom,
        dateTo,
      });
    },
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
}

export type { Order, OrdersResponse };
