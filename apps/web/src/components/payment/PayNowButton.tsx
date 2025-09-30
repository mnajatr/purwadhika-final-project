"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { PaymentModal } from "./PaymentModal";

export interface PayNowButtonProps {
  orderId: number;
  orderTotal: number;
  disabled?: boolean;
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onPaymentSuccess?: () => void;
  onPaymentPending?: () => void;
  onPaymentError?: (error: string) => void;
}

export function PayNowButton({
  orderId,
  orderTotal,
  disabled = false,
  variant = "default",
  size = "default",
  className = "",
  onPaymentSuccess,
  onPaymentPending,
  onPaymentError,
}: PayNowButtonProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handlePayClick = () => {
    setIsLoading(true);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsLoading(false);
  };

  return (
    <>
      <Button
        onClick={handlePayClick}
        disabled={disabled || isLoading}
        variant={variant}
        size={size}
        className={`${className} relative`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <CreditCard className="w-4 h-4 mr-2" />
        )}
        Pay Now
      </Button>

      <PaymentModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        orderId={orderId}
        orderTotal={orderTotal}
        onPaymentSuccess={() => {
          handleModalClose();
          onPaymentSuccess?.();
        }}
        onPaymentPending={() => {
          handleModalClose();
          onPaymentPending?.();
        }}
        onPaymentError={(error) => {
          handleModalClose();
          onPaymentError?.(error);
        }}
      />
    </>
  );
}
