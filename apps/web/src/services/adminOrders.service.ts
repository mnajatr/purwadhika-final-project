import apiClient from "@/lib/axios-client";

type ListResp = {
  items: unknown[];
  total: number;
  page: number;
  pageSize: number;
};

class AdminOrdersService {
  private readonly basePath = "/admin/orders";

  async getOrders(opts?: {
    page?: number;
    pageSize?: number;
    status?: string;
    q?: string;
    storeId?: number;
  }) {
    const params: Record<string, unknown> = {};
    // Always include page and pageSize, don't check for truthy values since page 1 is falsy
    params.page = opts?.page ?? 1;
    params.pageSize = opts?.pageSize ?? 20;
    if (opts?.status) params.status = opts.status;
    if (opts?.q) params.q = opts.q;
    if (typeof opts?.storeId === "number") params.storeId = opts.storeId;

    const envelope = await apiClient.get<{ success: boolean; data: ListResp }>(
      this.basePath,
      params
    );
    return envelope.data;
  }

  async updateOrderStatus(
    orderId: number,
    action: "confirm" | "ship" | "cancel"
  ) {
    const endpoint = `${this.basePath}/${orderId}/${action}`;
    const response = await apiClient.patch<{
      success: boolean;
      message: string;
    }>(endpoint);
    return response;
  }

  async getOrderById(orderId: number) {
    const endpoint = `${this.basePath}/${orderId}`;
    const response = await apiClient.get<{ success: boolean; data: unknown }>(
      endpoint
    );
    return response.data;
  }
}

export const adminOrdersService = new AdminOrdersService();
export const getAdminOrders = (opts?: {
  page?: number;
  pageSize?: number;
  status?: string;
  q?: string;
  storeId?: number;
}) => adminOrdersService.getOrders(opts);
