import apiClient from "@/lib/axios-client";
import {
  AdminOrdersListResponseSchema,
  AdminOrderDetailSchema,
  type AdminOrdersListResponse,
  type AdminOrdersFilter,
  type AdminOrderDetail,
} from "@repo/schemas";

class AdminOrdersService {
  private readonly basePath = "/admin/orders";

  async getOrders(opts?: AdminOrdersFilter): Promise<AdminOrdersListResponse> {
    const params: Record<string, unknown> = {};
    params.page = opts?.page ?? 1;
    params.pageSize = opts?.pageSize ?? 20;
    if (opts?.status) params.status = opts.status;
    if (opts?.q) params.q = opts.q;
    if (typeof opts?.storeId === "number") params.storeId = opts.storeId;

    if (opts?.from) {
      const startOfDay = new Date(opts.from);
      startOfDay.setHours(0, 0, 0, 0);
      params.dateFrom = startOfDay.toISOString();
    }

    if (opts?.to) {
      const endOfDay = new Date(opts.to);
      endOfDay.setHours(23, 59, 59, 999);
      params.dateTo = endOfDay.toISOString();
    } else if (opts?.from && !opts?.to) {
      // If only 'from' is set, include the whole day
      const endOfDay = new Date(opts.from);
      endOfDay.setHours(23, 59, 59, 999);
      params.dateTo = endOfDay.toISOString();
    }

    const response = await apiClient.get<{
      success: boolean;
      data: AdminOrdersListResponse;
    }>(this.basePath, params);

    const parsed = AdminOrdersListResponseSchema.safeParse(response.data);
    if (!parsed.success) {
      throw new Error(`Invalid admin orders response: ${parsed.error.message}`);
    }
    return parsed.data;
  }

  async getOrderById(orderId: number): Promise<AdminOrderDetail> {
    const endpoint = `${this.basePath}/${orderId}`;
    const response = await apiClient.get<{
      success: boolean;
      data: unknown;
    }>(endpoint);

    const parsed = AdminOrderDetailSchema.safeParse(response.data);
    if (!parsed.success) {
      throw new Error(`Invalid order detail response: ${parsed.error.message}`);
    }
    return parsed.data;
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
}

export const adminOrdersService = new AdminOrdersService();
export const getAdminOrders = (opts?: AdminOrdersFilter) =>
  adminOrdersService.getOrders(opts);
export const getAdminOrderById = (orderId: number) =>
  adminOrdersService.getOrderById(orderId);
