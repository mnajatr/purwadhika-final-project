import { Redis } from "ioredis";
import logger from "../utils/logger.js";

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

export const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
  db: 0, // Explicitly use database 0
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Add connection event logging
redis.on("connect", () => {
  logger.info("🔗 Redis connecting...");
});

redis.on("ready", () => {
  logger.info("✅ Redis connected and ready!");
});

redis.on("error", (err) => {
  logger.error("❌ Redis connection error:", err.message);
});

redis.on("close", () => {
  logger.info("🔌 Redis connection closed");
});

export type RedisClient = typeof redis;
