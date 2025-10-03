import { Request, Response, NextFunction } from "express";
import { checkoutService } from "../services/checkout.service.js";
import { orderReadService } from "../services/order.read.service.js";
import { CheckoutSchema } from "@repo/schemas";
import { successResponse } from "../utils/helpers.js";
import {
  createValidationError,
  createUnauthorizedError,
  createNotFoundError,
} from "../errors/app.error.js";

type AuthRequest = Request & {
  user?: { id: number; role?: string; storeId?: number };
  storeScopedId?: number;
};

export class CheckoutController {
  private checkoutService = checkoutService;
  private orderReadService = orderReadService;

  private getUserIdFromReq(req: Request): number {
    const authReq = req as AuthRequest;

    // First try authenticated user
    if (authReq.user?.id) {
      return authReq.user.id;
    }

    // In non-production, allow dev headers/query params for testing
    if (process.env.NODE_ENV !== "production") {
      const headerUserId = req.headers["x-dev-user-id"];
      if (headerUserId) {
        const parsed = Number(headerUserId);
        if (!isNaN(parsed)) return parsed;
      }

      const queryUserId = req.query?.userId || req.body?.userId;
      if (queryUserId) {
        const parsed = Number(queryUserId);
        if (!isNaN(parsed)) return parsed;
      }
    }

    // If no userId found, throw authentication error
    throw createUnauthorizedError("Authentication required");
  }

  listOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;

      const effectiveUserId =
        authReq.user &&
        (authReq.user.role === "SUPER_ADMIN" ||
          authReq.user.role === "STORE_ADMIN")
          ? undefined
          : userId;

      const status = req.query.status as string | undefined;
      const q = req.query.q as string | undefined;
      const dateFrom = req.query.dateFrom as string | undefined;
      const dateTo = req.query.dateTo as string | undefined;
      const page = Number(req.query.page ?? 1);
      const pageSize = Number(req.query.pageSize ?? 20);

      const storeIdFromMiddleware =
        authReq.storeScopedId ?? authReq.user?.storeId;
      const storeId =
        storeIdFromMiddleware ??
        (req.query?.storeId ? Number(req.query.storeId) : undefined);

      const result = await this.orderReadService.listOrders({
        userId: effectiveUserId,
        storeId,
        status,
        q,
        dateFrom,
        dateTo,
        page,
        pageSize,
      });

      res
        .status(200)
        .json(successResponse(result, "Orders retrieved successfully"));
    } catch (error) {
      next(error);
    }
  };

  createOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserIdFromReq(req);

      const idempotencyKey =
        (req.headers["idempotency-key"] as string) ||
        req.body?.idempotencyKey ||
        req.query?.idempotencyKey;

      const payload = {
        ...req.body,
        idempotencyKey,
      };

      const parsed = CheckoutSchema.safeParse(payload);
      if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors;
        const errors = Object.entries(fieldErrors).map(([field, messages]) => ({
          field,
          message: Array.isArray(messages) ? messages[0] : messages,
        }));
        throw createValidationError(
          errors.map((e) => `${e.field}: ${e.message}`).join(", ")
        );
      }

      const {
        items,
        userLat,
        userLon,
        addressId,
        paymentMethod,
        shippingMethod,
        shippingOption,
      } = parsed.data;

      const result = await this.checkoutService.createCheckout(
        userId,
        req.body?.storeId ? Number(req.body.storeId) : undefined,
        items,
        idempotencyKey,
        userLat,
        userLon,
        addressId,
        paymentMethod,
        shippingMethod,
        shippingOption
      );

      res
        .status(201)
        .json(successResponse(result, "Order created successfully"));
    } catch (error) {
      next(error);
    }
  };

  getOrderById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) {
        throw createValidationError("Invalid order id");
      }

      const order = await this.orderReadService.getOrderById(id);
      if (!order) {
        throw createNotFoundError("Order");
      }

      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;

      if (
        userId &&
        order.userId !== userId &&
        process.env.NODE_ENV === "production"
      ) {
        throw createUnauthorizedError("Access denied");
      }

      res
        .status(200)
        .json(successResponse(order, "Order retrieved successfully"));
    } catch (error) {
      next(error);
    }
  };
}

export const checkoutController = new CheckoutController();
