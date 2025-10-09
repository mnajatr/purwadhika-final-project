import { Redis } from "@upstash/redis";
import logger from "../utils/logger.js";

const UPSTASH_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Be tolerant at import-time: do not throw when env vars are missing.
 * Throwing on import will crash serverless functions during cold start.
 * Instead, log a warning and export undefined values.
 */
let redis: Redis | undefined = undefined;

if (UPSTASH_REST_URL && UPSTASH_REST_TOKEN) {
  redis = new Redis({ url: UPSTASH_REST_URL, token: UPSTASH_REST_TOKEN });
  logger.info("Upstash Redis client initialized");
} else {
  logger.warn(
    "Upstash environment variables are missing. Redis client will be disabled until UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are provided."
  );
}

export { redis };
export type RedisClient = typeof redis;

export default redis;
