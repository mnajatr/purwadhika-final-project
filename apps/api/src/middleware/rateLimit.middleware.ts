import { Request, Response, NextFunction } from "express";
import { errorResponse } from "../utils/helpers.js";

const requestCounts = new Map<string, { count: number; resetTime: number }>();

const createRateLimit = (
  windowMs: number,
  maxRequests: number,
  message: string
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    const now = Date.now();

    const clientData = requestCounts.get(ip);

    if (!clientData || now > clientData.resetTime) {
      requestCounts.set(ip, {
        count: 1,
        resetTime: now + windowMs,
      });
      next();
      return;
    }

    if (clientData.count >= maxRequests) {
      const response = errorResponse("Rate limit exceeded", message);
      res.status(429).json(response);
      return;
    }

    clientData.count++;
    next();
  };
};

export const apiRateLimit = createRateLimit(
  15 * 60 * 1000,
  1000,
  "You have exceeded the rate limit. Please try again later."
);

export const cartRateLimit = createRateLimit(
  5 * 60 * 1000,
  500,
  "You are performing cart operations too frequently. Please slow down."
);

export const authRateLimit = createRateLimit(
  15 * 60 * 1000,
  5,
  "You have exceeded the authentication rate limit. Please try again later."
);
