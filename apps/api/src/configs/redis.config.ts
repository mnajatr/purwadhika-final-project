import { Redis } from "@upstash/redis";
import type { ConnectionOptions } from "bullmq";
import logger from "../utils/logger.js";

const UPSTASH_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Be tolerant at import-time: do not throw when env vars are missing.
 * Throwing on import will crash serverless functions during cold start.
 * Instead, log a warning and export undefined values. The rest of the
 * application can check for presence of `bullConnection` before creating
 * queues or workers.
 */
let redis: Redis | undefined = undefined;
let bullConnection: ConnectionOptions | undefined = undefined;

if (UPSTASH_REST_URL && UPSTASH_REST_TOKEN) {
  redis = new Redis({ url: UPSTASH_REST_URL, token: UPSTASH_REST_TOKEN });
  // Pragmatic cast: Upstash client shape is not the same as ioredis but
  // bullmq accepts a variety of connection objects; keep the cast but
  // mark the connection optional.
  bullConnection = redis as unknown as ConnectionOptions;
  logger.info("Upstash Redis client initialized");
} else {
  logger.warn(
    "Upstash environment variables are missing. Redis-backed queues/workers will be disabled until UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are provided."
  );
}

export { redis };
export type RedisClient = typeof redis;
export { bullConnection };

export default redis;
