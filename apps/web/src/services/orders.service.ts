import apiClient from "@/lib/axios-client";

type ListResp = {
  items: unknown[];
  total: number;
  page: number;
  pageSize: number;
};

class OrdersService {
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

    console.log(
      "Orders service calling:",
      this.basePath,
      "with params:",
      params
    );
    const envelope = await apiClient.get<{ success: boolean; data: ListResp }>(
      this.basePath,
      params
    );
    console.log("Orders service received envelope:", envelope);
    return envelope.data;
  }

  async updateOrderStatus(
    orderId: number,
    action: "confirm" | "ship" | "cancel"
  ) {
    const endpoint = `${this.basePath}/${orderId}/${action}`;
    console.log("Orders service calling:", endpoint);
    const response = await apiClient.patch<{
      success: boolean;
      message: string;
    }>(endpoint);
    console.log("Orders service action response:", response);
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

export const ordersService = new OrdersService();
export const getAdminOrders = (opts?: {
  page?: number;
  pageSize?: number;
  status?: string;
  q?: string;
  storeId?: number;
}) => ordersService.getOrders(opts);
