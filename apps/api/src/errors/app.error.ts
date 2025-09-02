export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const createNotFoundError = (resource: string) =>
  new AppError(`${resource} not found`, 404);

export const createValidationError = (message: string) =>
  new AppError(message, 400);

export const createUnauthorizedError = (message: string = "Unauthorized") =>
  new AppError(message, 401);

export const createForbiddenError = (message: string = "Forbidden") =>
  new AppError(message, 403);

export const createConflictError = (message: string) =>
  new AppError(message, 409);
