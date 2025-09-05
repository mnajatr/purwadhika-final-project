import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

export const validateSchema = (schema: {
  body?: z.ZodSchema;
  params?: z.ZodSchema;
  query?: z.ZodSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        const bodyResult = schema.body.safeParse(req.body);
        if (!bodyResult.success) {
          return res.status(400).json({
            message: "Invalid request body",
            errors: bodyResult.error.issues.map((err: any) => ({
              field: err.path.join("."),
              message: err.message,
            })),
          });
        }
        req.body = bodyResult.data;
      }

      if (schema.params) {
        const paramsResult = schema.params.safeParse(req.params);
        if (!paramsResult.success) {
          return res.status(400).json({
            message: "Invalid request parameters",
            errors: paramsResult.error.issues.map((err: any) => ({
              field: err.path.join("."),
              message: err.message,
            })),
          });
        }
        // assign parsed params with a safer cast to the expected Request['params'] shape
        req.params = paramsResult.data as Request["params"];
      }

      if (schema.query) {
        const queryResult = schema.query.safeParse(req.query);
        if (!queryResult.success) {
          return res.status(400).json({
            message: "Invalid query parameters",
            errors: queryResult.error.issues.map((err: any) => ({
              field: err.path.join("."),
              message: err.message,
            })),
          });
        }
        req.query = queryResult.data as Request["query"];
      }

      next();
    } catch (error) {
      res.status(500).json({
        message: "Validation error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
};

export const validateBody = (schema: z.ZodSchema) => {
  return validateSchema({ body: schema });
};

export const validateParams = (schema: z.ZodSchema) => {
  return validateSchema({ params: schema });
};

export const validateQuery = (schema: z.ZodSchema) => {
  return validateSchema({ query: schema });
};
