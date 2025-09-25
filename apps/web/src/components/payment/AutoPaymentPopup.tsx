"use client";

import React, { useEffect } from "react";
import { PaymentModal } from "@/components/payment/PaymentModal";

export interface PaymentSessionKey {
  orderId: number;
  orderTotal: number;
  timestamp: number;
  paymentMethod?: string;
}

export interface AutoPaymentPopupProps {
  orderId: number;
  orderTotal: number;
  onPaymentSuccess?: () => void;
  onPaymentPending?: () => void;
  onPaymentError?: (error: string) => void;
}

const PAYMENT_SESSION_KEY = "pendingPayment";
const PAYMENT_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// Utility functions for sessionStorage
export const PaymentSession = {
  set: (data: PaymentSessionKey) => {
    try {
      sessionStorage.setItem(PAYMENT_SESSION_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn("Failed to set payment session:", error);
    }
  },

  get: (): PaymentSessionKey | null => {
    try {
      const stored = sessionStorage.getItem(PAYMENT_SESSION_KEY);
      if (!stored) return null;

      const data = JSON.parse(stored) as PaymentSessionKey;

      // Check if expired
      if (Date.now() - data.timestamp > PAYMENT_EXPIRY_MS) {
        PaymentSession.clear();
        return null;
      }

      return data;
    } catch (error) {
      console.warn("Failed to get payment session:", error);
      PaymentSession.clear();
      return null;
    }
  },

  clear: () => {
    try {
      sessionStorage.removeItem(PAYMENT_SESSION_KEY);
    } catch (error) {
      console.warn("Failed to clear payment session:", error);
    }
  },

  isExpired: (data: PaymentSessionKey): boolean => {
    return Date.now() - data.timestamp > PAYMENT_EXPIRY_MS;
  },
};

// Component for auto-popup payment modal
export function AutoPaymentPopup({
  orderId,
  orderTotal,
  onPaymentSuccess,
  onPaymentPending,
  onPaymentError,
}: AutoPaymentPopupProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [shouldAutoOpen, setShouldAutoOpen] = React.useState(false);

  useEffect(() => {
    // Check if there's a matching payment session
    const paymentSession = PaymentSession.get();

    if (
      paymentSession &&
      paymentSession.orderId === orderId &&
      paymentSession.paymentMethod === "Gateway" &&
      !PaymentSession.isExpired(paymentSession)
    ) {
      // Auto-open payment modal
      setShouldAutoOpen(true);
      setIsModalOpen(true);

      // Clear the session since we're handling it
      PaymentSession.clear();
    }
  }, [orderId]);

  const handleModalClose = () => {
    setIsModalOpen(false);
    setShouldAutoOpen(false);
  };

  const handlePaymentSuccess = () => {
    handleModalClose();
    onPaymentSuccess?.();
  };

  const handlePaymentPending = () => {
    handleModalClose();
    onPaymentPending?.();
  };

  const handlePaymentError = (error: string) => {
    handleModalClose();
    onPaymentError?.(error);
  };

  // Only render if we should auto-open
  if (!shouldAutoOpen) {
    return null;
  }

  return (
    <PaymentModal
      isOpen={isModalOpen}
      onClose={handleModalClose}
      orderId={orderId}
      orderTotal={orderTotal}
      onPaymentSuccess={handlePaymentSuccess}
      onPaymentPending={handlePaymentPending}
      onPaymentError={handlePaymentError}
    />
  );
}
