/**
 * Server-side logger for Next.js API routes.
 * Outputs structured logs with timestamps, request context, and timing.
 */

type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

function timestamp(): string {
  return new Date().toISOString();
}

function formatLog(level: LogLevel, module: string, message: string, meta?: Record<string, unknown>): string {
  const metaStr = meta ? ` | ${JSON.stringify(meta)}` : "";
  return `[${timestamp()}] ${level.padEnd(5)} | ${module.padEnd(20)} | ${message}${metaStr}`;
}

export function createLogger(module: string) {
  return {
    info: (message: string, meta?: Record<string, unknown>) => {
      console.log(formatLog("INFO", module, message, meta));
    },
    warn: (message: string, meta?: Record<string, unknown>) => {
      console.warn(formatLog("WARN", module, message, meta));
    },
    error: (message: string, meta?: Record<string, unknown>) => {
      console.error(formatLog("ERROR", module, message, meta));
    },
    debug: (message: string, meta?: Record<string, unknown>) => {
      if (process.env.NODE_ENV === "development") {
        console.log(formatLog("DEBUG", module, message, meta));
      }
    },
  };
}
