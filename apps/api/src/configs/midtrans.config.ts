import midtransClient from "midtrans-client";
import logger from "../utils/logger.js";

let snap: midtransClient.Snap | undefined = undefined;

try {
  const clientKey = process.env.MIDTRANS_CLIENT_KEY;
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!clientKey || !serverKey) {
    logger.warn(
      "MIDTRANS keys are not configured. Midtrans client will be unavailable."
    );
  } else {
    // Use MIDTRANS_IS_PRODUCTION env var to control sandbox vs production
    // Default to false (sandbox) for safety
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

    snap = new midtransClient.Snap({
      isProduction,
      clientKey,
      serverKey,
    });
    logger.info(
      `Midtrans client initialized (${
        isProduction ? "production" : "sandbox"
      } mode)`
    );
  }
} catch (err) {
  logger.warn("Failed to initialize Midtrans client:", String(err));
}

export { snap };
