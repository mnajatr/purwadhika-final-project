import axios, { AxiosInstance, AxiosResponse, AxiosError } from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Custom error that carries the Axios response (if any)
export class ApiError extends Error {
  response?: AxiosResponse;
  constructor(message: string, response?: AxiosResponse) {
    super(message);
    this.name = "ApiError";
    this.response = response;
  }
}

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = API_BASE_URL) {
    this.client = axios.create({
      baseURL,
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    // Add development user ID for testing. Read from localStorage.devUserId when available
    this.client.interceptors.request.use((config) => {
      if (process.env.NODE_ENV !== "production") {
        try {
          // Prefer explicit dev id saved in localStorage (set by dev UI)
          if (typeof window !== "undefined") {
            const stored = localStorage.getItem("devUserId");
            console.log("axios-client: devUserId from localStorage:", stored);
            if (stored && stored !== "none") {
              config.headers["x-dev-user-id"] = stored;
              console.log("axios-client: set x-dev-user-id to:", stored);
            }
            // if stored is "none" or not present, fall back to default
          }
        } catch {
          // ignore localStorage errors and fall back to default
        }

        // Default fallback id when none is set
        if (!config.headers["x-dev-user-id"]) {
          config.headers["x-dev-user-id"] = "4";
          console.log("axios-client: using default x-dev-user-id: 4");
        }
      }
      console.log(
        "API Request:",
        config.method?.toUpperCase(),
        config.url,
        config.params,
        "headers x-dev-user-id:",
        config.headers["x-dev-user-id"]
      );
      return config;
    });

    // Normalize errors in one place so callers get Error.message and can access the Axios response
    // via the ApiError.response property when available.
    this.client.interceptors.response.use(
      (resp: AxiosResponse) => {
        console.log("API Response:", resp.status, resp.config.url, resp.data);
        return resp;
      },
      (error: AxiosError) => {
        // log as a warning to avoid noisy dev-console errors being treated as runtime exceptions
        console.warn(
          "API Error:",
          error.response?.status,
          error.config?.url,
          error.response?.data
        );
        const responseData = error.response?.data;
        let message = error.message ?? "Request failed";
        if (
          responseData &&
          typeof responseData === "object" &&
          Object.prototype.hasOwnProperty.call(responseData, "message")
        ) {
          const maybeMsg = (responseData as Record<string, unknown>)["message"];
          if (typeof maybeMsg === "string") {
            message = maybeMsg;
          }
        }
        const apiErr = new ApiError(message, error.response);
        return Promise.reject(apiErr);
      }
    );
  }

  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const resp = await this.client.get<T>(url, { params });
    return resp.data;
  }

  async post<T, D = unknown>(url: string, data?: D): Promise<T> {
    const resp = await this.client.post<T>(url, data);
    return resp.data;
  }

  async patch<T, D = unknown>(url: string, data?: D): Promise<T> {
    const resp = await this.client.patch<T>(url, data);
    return resp.data;
  }

  async put<T, D = unknown>(url: string, data?: D): Promise<T> {
    const resp = await this.client.put<T>(url, data);
    return resp.data;
  }

  async delete<T, D = unknown>(url: string, data?: D): Promise<T> {
    const resp = await this.client.delete<T>(url, { data });
    return resp.data;
  }
}

export const apiClient = new ApiClient();

export default apiClient;
