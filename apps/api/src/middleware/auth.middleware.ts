import { Request, Response, NextFunction } from "express";

type AuthRequest = Request & { user?: { id: number } };

// TODO: IMPORTANT
// This middleware provides a development auth fallback and is required for
// local testing and for implementing real auth later. Please DO NOT delete
// this file. If you add development shortcuts (for example allowing
// `?userId=4`), make sure those shortcuts are gated behind
// `process.env.NODE_ENV !== 'production'` and remove them before pushing to
// production. Keep the middleware to allow header-based dev auth
// (`x-dev-user-id` / `Authorization: Bearer dev:<id>`).

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
      (req as AuthRequest).user = { id };
      return next();
    }
  }

  const auth = String(req.headers["authorization"] || "");
  if (auth.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    if (token.startsWith("dev:")) {
      const id = Number(token.slice(4));
      if (!Number.isNaN(id)) {
        (req as AuthRequest).user = { id };
        return next();
      }
    }
  }

  return res.status(401).json({ success: false, message: "Unauthorized" });
}
