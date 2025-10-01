import apiClient from "@/lib/axios-client";

export class StoresService {
  private readonly basePath = "/admin/stores";

  async list() {
    const resp = await apiClient.get<{
      success: boolean;
      data: Array<{ id: number; name: string }>;
    }>(this.basePath);
    return resp.data;
  }

  async getProfile() {
    const resp = await apiClient.get<{
      success: boolean;
      data: { id: number; role: string; storeId: number | null };
    }>("/admin/me");
    return resp.data;
  }
  async getAll() {
    const resp = await apiClient.get<{
      success: boolean;
      data: Array<{ id: number; name: string }>;
    }>("/stores");
    return resp.data;
  }
}

export const storesService = new StoresService();
