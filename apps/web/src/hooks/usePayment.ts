"use client";

import { useMutation } from "@tanstack/react-query";
import { paymentService, type SnapResponse } from "@/services/payment.service";

// Type for Midtrans transaction result
export interface MidtransResult {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_time: string;
  transaction_status: string;
  fraud_status?: string;
}

// Type for Midtrans Snap Window
declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options?: {
          onSuccess?: (result: MidtransResult) => void;
          onPending?: (result: MidtransResult) => void;
          onError?: (result: MidtransResult) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

// Hook untuk create snap token
export function useCreateSnapToken() {
  return useMutation({
    mutationFn: async (orderId: number) => {
      const response = await paymentService.createSnapToken(orderId);
      return response.data as SnapResponse;
    },
  });
}

// Hook untuk upload payment proof
export function useUploadPaymentProof() {
  return useMutation({
    mutationFn: async ({
      orderId,
      proofFile,
    }: {
      orderId: number;
      proofFile: File;
    }) => {
      const response = await paymentService.uploadPaymentProof(
        orderId,
        proofFile
      );
      return response.data;
    },
  });
}

// Payment hooks exports
export { paymentService };