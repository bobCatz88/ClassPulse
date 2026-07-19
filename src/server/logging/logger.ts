import { v4 as uuidv4 } from "uuid";
import winston from "winston";

export type LogMeta = Record<string, unknown>;

const sensitiveKeys = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "password",
  "token",
  "access_token",
  "refresh_token",
  "apiKey",
  "api_key",
  "serviceRole",
  "service_role",
  "transcript",
  "student_name",
  "display_name",
]);

export function createRequestId() {
  return uuidv4();
}

export function redactLogMeta(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => redactLogMeta(item));
  if (!value || typeof value !== "object") return value;
  const output: LogMeta = {};
  for (const [key, child] of Object.entries(value as LogMeta)) {
    output[key] = sensitiveKeys.has(key) ? "[REDACTED]" : redactLogMeta(child);
  }
  return output;
}

const redactFormat = winston.format((info) => redactLogMeta(info) as winston.Logform.TransformableInfo);

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  defaultMeta: {
    service: "classpulse-ai",
    environment: process.env.NODE_ENV || "development",
  },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    redactFormat(),
    winston.format.json(),
  ),
  transports: [new winston.transports.Console()],
});

if (process.env.LOG_TO_FILE === "true") {
  logger.add(new winston.transports.File({ filename: "logs/error.log", level: "error" }));
  logger.add(new winston.transports.File({ filename: "logs/combined.log" }));
}

export function requestLogMeta(request: Request, requestId: string): LogMeta {
  const url = new URL(request.url);
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return {
    requestId,
    method: request.method,
    path: url.pathname,
    ip: forwardedFor || request.headers.get("x-real-ip") || undefined,
    userAgent: request.headers.get("user-agent") || undefined,
  };
}

export function errorLogMeta(error: unknown): LogMeta {
  if (error instanceof Error) return { errorMessage: error.message, stack: error.stack };
  return { errorMessage: "Ralat tidak diketahui" };
}
