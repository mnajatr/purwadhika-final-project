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

const logger = winston.createLogger({
  level: "info",
  transports: [
    new winston.transports.Console({
      format: consoleLogFormat,
    }),
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      format: fileLogFormat,
      maxsize: 5242880,
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      format: fileLogFormat,
      maxsize: 5242880,
    }),
  ],
});

export default logger;
