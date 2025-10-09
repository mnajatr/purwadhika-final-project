import { Client } from "@upstash/qstash";
import logger from "../utils/logger.js";

const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const QSTASH_URL = process.env.QSTASH_URL;

/**
 * QStash client for publishing delayed/scheduled messages.
 * Tolerant at import-time: do not throw when env vars are missing.
 */
let qstashClient: Client | undefined = undefined;

if (QSTASH_TOKEN) {
  qstashClient = new Client({ token: QSTASH_TOKEN });
  logger.info("Upstash QStash client initialized");
} else {
  logger.warn(
    "QStash environment variables are missing. Queue functionality will be disabled until QSTASH_TOKEN is provided."
  );
}

export { qstashClient, QSTASH_URL };
export default qstashClient;
