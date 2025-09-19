"use client";

import { useMemo, useCallback } from "react";
import { toast } from "sonner";

interface ToastMessages {
  stockExceeded?: string;
  maxReached?: string;
  outOfStock?: string;
}

interface UseStockHandlerParams {
  currentQuantity: number;
  stockQuantity: number;
  showToasts?: boolean;
  toastMessages?: ToastMessages;
}

interface ActionButtonProps {
  disabled: boolean;
  text: string;
  variant: "default" | "outOfStock";
}

export function useStockHandler({
  currentQuantity,
  stockQuantity,
  showToasts = true,
  toastMessages,
}: UseStockHandlerParams) {
  const messages = useMemo(() => {
    const defaultToastMessages: Required<ToastMessages> = {
      stockExceeded: `Quantity exceeds available stock (${stockQuantity})`,
      maxReached: `You've reached the maximum available stock (${stockQuantity})`,
      outOfStock: "This product is currently out of stock",
    };
    return {
      ...defaultToastMessages,
      ...toastMessages,
    };
  }, [stockQuantity, toastMessages]);

  const isOutOfStock = stockQuantity === 0;
  const isMaxReached = currentQuantity >= stockQuantity;
  const isIncreaseDisabled = isOutOfStock || isMaxReached;
  const isDecreaseDisabled = currentQuantity <= 1;

  const handleIncrease = useCallback(() => {
    if (isOutOfStock) {
      if (showToasts) {
        toast.error(messages.outOfStock);
      }
      return false;
    }
    if (currentQuantity >= stockQuantity) {
      if (showToasts) {
        toast.error(messages.stockExceeded);
      }
      return false;
    }
    return true;
  }, [currentQuantity, stockQuantity, isOutOfStock, showToasts, messages]);

  const handleDecrease = useCallback(() => {
    if (currentQuantity <= 1) {
      return false;
    }
    return true;
  }, [currentQuantity]);

  const handleQuantityChange = useCallback(
    (newQuantity: number) => {
      if (newQuantity <= 0) {
        return false;
      }
      if (isOutOfStock) {
        if (showToasts) {
          toast.error(messages.outOfStock);
        }
        return false;
      }
      if (newQuantity > stockQuantity) {
        if (showToasts) {
          toast.error(messages.stockExceeded);
        }
        return false;
      }
      return true;
    },
    [isOutOfStock, stockQuantity, showToasts, messages]
  );

  const getActionButtonProps = useCallback((): ActionButtonProps => {
    if (isOutOfStock) {
      return {
        disabled: true,
        text: "Out of Stock",
        variant: "outOfStock",
      };
    }
    return {
      disabled: false,
      text: "Add to Cart",
      variant: "default",
    };
  }, [isOutOfStock]);

  return {
    isOutOfStock,
    isMaxReached,
    isIncreaseDisabled,
    isDecreaseDisabled,
    handleIncrease,
    handleDecrease,
    handleQuantityChange,
    getActionButtonProps,
  };
}
