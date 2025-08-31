import { NextFunction, Request, Response } from "express";

export function notFoundMiddleware(
  request: Request,
  response: Response,
  next: NextFunction
) {
  response.status(404).json({
    success: false,
    message: "The route you are looking for does not exist",
  });
}
