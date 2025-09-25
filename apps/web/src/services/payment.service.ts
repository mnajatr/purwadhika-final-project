import { apiClient } from "@/lib/axios-client";
import type { ApiResponse } from "@/types/api";

export type SnapResponse = {
  clientKey: string | null;
  snapToken: string;
  redirectUrl: string;
};

export class PaymentService {
  private base = "/orders";

  async createSnapToken(orderId: number): Promise<ApiResponse<SnapResponse>> {
    return apiClient.post<ApiResponse<SnapResponse>>(
      `${this.base}/${orderId}/snap`
    );
  }

  async uploadPaymentProof(
    orderId: number,
    proofFile: File
  ): Promise<ApiResponse<unknown>> {
    const formData = new FormData();
    formData.append("proof", proofFile);

    return apiClient.post<ApiResponse<unknown>>(
      `${this.base}/${orderId}/payment-proof`,
      formData
    );
  }
}

export const paymentService = new PaymentService();
