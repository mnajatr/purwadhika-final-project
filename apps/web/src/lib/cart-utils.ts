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
  toast.error(message);
};
