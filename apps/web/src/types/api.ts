export type RequestData =
  | Record<string, unknown>
  | Record<number, unknown>
  | unknown;

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type QueryParams = Record<string, string | number | boolean>;
