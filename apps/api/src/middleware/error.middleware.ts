import { Request, Response, NextFunction } from "express";
import z, { ZodError } from "zod";
import { Prisma } from "@repo/database/generated/prisma";
import { AppError } from "../errors/app.error.js";

export function errorMiddleware(
  error: Error,
  request: Request,
  response: Response,
  next: NextFunction
) {
  console.error("Error:", error.message);

  if (error instanceof Error) {
    console.error(error.stack || error);
  } else {
    console.error("Non-error thrown:", error);
  }

  if (error instanceof AppError)
    return response.status(error.statusCode).json({ message: error.message });

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return response.status(400).json({
        message: "Duplicate value violates unique constraint.",
        code: error.code,
      });
    }
    return response
      .status(400)
      .json({ message: error.message, code: error.code });
  }

  if (error instanceof ZodError) {
    return response.status(400).json({
      error: z.flattenError(error).fieldErrors,
      code: error.issues[0]?.code,
    });
  }

  response.status(500).json({
    message: error instanceof Error ? error.message : "Unknown error occurred",
  });
}
