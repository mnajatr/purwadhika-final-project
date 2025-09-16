import { Router } from "express";
import { DebugController } from "../controllers/debug.controller.js";

const debugRouter = Router();

// GET /api/test-cors - CORS test endpoint
debugRouter.get("/test-cors", DebugController.testCors);

// GET /api/_internal/cloudinary - Cloudinary status endpoint
debugRouter.get("/_internal/cloudinary", DebugController.cloudinaryStatus);

export default debugRouter;