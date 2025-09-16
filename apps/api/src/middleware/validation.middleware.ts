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
        // merge validated params into existing req.params to avoid assigning to a getter-only property
        Object.assign(
          req.params as Record<string, any>,
          paramsResult.data as Record<string, any>
        );
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
        // merge validated query into existing req.query to avoid assigning to a getter-only property
        Object.assign(
          req.query as Record<string, any>,
          queryResult.data as Record<string, any>
        );
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
