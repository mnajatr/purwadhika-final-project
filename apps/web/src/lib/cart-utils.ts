import { toast } from "sonner";
import type { ApiError } from "../types/api";

export class CartError extends Error {
  public readonly code?: string;
  public readonly statusCode?: number;

  constructor(message: string, code?: string, statusCode?: number) {
    super(message);
    this.name = "CartError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export const handleApiError = (error: unknown): CartError => {
  if (error instanceof CartError) {
    return error;
  }

  if (error instanceof Error) {
    return new CartError(error.message);
  }

  if (typeof error === "string") {
    return new CartError(error);
  }

  return new CartError("An unknown error occurred");
};

export const isApiError = (data: unknown): data is ApiError => {
  return (
    data !== null &&
    typeof data === "object" &&
    "success" in data &&
    (data as { success: unknown }).success === false
  );
};

export const showCartSuccessMessage = (message: string) => {
  toast.success(message);
};

export const showCartErrorMessage = (message: string) => {
  // Convert technical error messages to user-friendly ones
  let displayMessage = message;
  
  if (message.includes("stock") || message.includes("exceeds available") || message.includes("Insufficient stock")) {
    displayMessage = "Sorry, not enough stock available for the requested quantity.";
  } else if (message.includes("out of stock") || message.includes("stock: 0") || message.includes("Available: 0")) {
    displayMessage = "Sorry, this product is currently out of stock.";
  }
  
  toast.error(displayMessage);
};
