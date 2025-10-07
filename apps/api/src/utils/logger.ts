import fs from "fs";
import path from "path";
import winston from "winston";

const { combine, timestamp, printf, colorize, align } = winston.format;

const consoleLogFormat = combine(
  colorize(),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  align(),
  printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
  })
);

const fileLogFormat = combine(
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
  })
);

// In serverless environments (Vercel) writing to disk may fail or be undesirable.
// Only enable file transports when explicitly allowed via env var, or when
// not in production (local development).
const enableFileLogs =
  process.env.ENABLE_FILE_LOGS === "true" || process.env.NODE_ENV !== "production";

const transports: winston.transport[] = [];

transports.push(
  new winston.transports.Console({
    format: consoleLogFormat,
  })
);

if (enableFileLogs) {
  try {
    const logDir = path.resolve(process.cwd(), "logs");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, "error.log"),
        level: "error",
        format: fileLogFormat,
        maxsize: 5242880,
      })
    );

    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, "combined.log"),
        format: fileLogFormat,
        maxsize: 5242880,
      })
    );
  } catch (err) {
    // If creating the log directory fails, fall back to console-only logging.
    // Avoid throwing during import to prevent serverless function crashes.
    // eslint-disable-next-line no-console
    console.warn("Logger: failed to enable file logging, falling back to console:", String(err));
  }
}

const logger = winston.createLogger({
  level: "info",
  transports,
});

export default logger;
