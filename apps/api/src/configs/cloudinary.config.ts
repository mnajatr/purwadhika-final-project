import { v2 as cloudinary } from "cloudinary";
import logger from "../utils/logger.js";

/**
 * Configure Cloudinary at startup from environment variables
 * This ensures the SDK has proper credentials before any uploads
 */
export function setupCloudinary(): void {
  try {
    if (process.env.CLOUDINARY_URL) {
      // cloudinary://<api_key>:<api_secret>@<cloud_name>
      try {
        const parsed = new URL(process.env.CLOUDINARY_URL);
        const apiKey = parsed.username;
        const apiSecret = parsed.password;
        const cloudName = parsed.hostname;
        
        if (apiKey && apiSecret && cloudName) {
          cloudinary.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret,
            secure: true,
          });
          logger.info("Cloudinary configured from CLOUDINARY_URL");
        } else {
          cloudinary.config({ secure: true });
          logger.warn("CLOUDINARY_URL present but parsing failed");
        }
      } catch (err) {
        cloudinary.config({ secure: true });
        logger.warn("Failed to parse CLOUDINARY_URL:", String(err));
      }
    } else if (process.env.CLOUDINARY_CLOUD_NAME) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      });
      logger.info("Cloudinary configured from CLOUDINARY_CLOUD_NAME/API_KEY");
    } else {
      logger.warn("No Cloudinary configuration found in environment variables");
    }
  } catch (err) {
    logger.warn("Cloudinary configuration error:", String(err));
  }
}

export { cloudinary };