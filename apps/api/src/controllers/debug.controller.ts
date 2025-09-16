import { Request, Response } from "express";
import { v2 as cloudinary } from "cloudinary";
import logger from "../utils/logger.js";

export class DebugController {
  // GET /api/test-cors - Simple CORS test endpoint
  static async testCors(request: Request, response: Response) {
    response.status(200).json({
      message: "CORS test successful",
      timestamp: new Date().toISOString(),
      origin: request.headers.origin,
    });
  }

  // GET /api/_internal/cloudinary - Internal debug endpoint for Cloudinary config
  static async cloudinaryStatus(_request: Request, response: Response) {
    try {
      const cfg = cloudinary.config();
      // only return cloud_name and whether CLOUDINARY_URL exists
      response.json({
        cloud_name: cfg.cloud_name || null,
        has_url_env: !!process.env.CLOUDINARY_URL,
        has_key_env: !!process.env.CLOUDINARY_API_KEY,
      });
    } catch (err) {
      logger.error(String(err));
      response.status(500).json({ error: String(err) });
    }
  }
}