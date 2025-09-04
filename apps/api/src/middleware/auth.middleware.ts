import { Request, Response, NextFunction } from "express";

// Dev-only auth middleware.
// Accepts either header `x-dev-user-id: <id>` or `Authorization: Bearer dev:<id>`
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const devIdHeader = req.headers["x-dev-user-id"] || req.query?.devUserId;
  if (devIdHeader) {
    const id = Number(devIdHeader as string);
    if (!Number.isNaN(id)) {
      (req as any).user = { id };
      return next();
    }
  }

  const auth = String(req.headers["authorization"] || "");
  if (auth.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    if (token.startsWith("dev:")) {
      const id = Number(token.slice(4));
      if (!Number.isNaN(id)) {
        (req as any).user = { id };
        return next();
      }
    }
  }

  return res.status(401).json({ success: false, message: "Unauthorized" });
}
