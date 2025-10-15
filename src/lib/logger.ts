/**
 * Centralized logger for API requests and errors
 * Logs include: request_id, user_id, method, path, status, latency, error details
 */

export interface LogContext {
  requestId: string;
  userId?: string;
  method: string;
  path: string;
  userAgent?: string;
}

export interface LogMetadata {
  status?: number;
  latency?: number;
  error?: Error;
  details?: Record<string, any>;
}

class Logger {
  private formatLog(
    level: "info" | "warn" | "error",
    message: string,
    context: LogContext,
    metadata?: LogMetadata
  ): string {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      requestId: context.requestId,
      userId: context.userId,
      method: context.method,
      path: context.path,
      userAgent: context.userAgent,
      ...metadata,
    };

    // In production, you might want to use a structured logging library
    // like Winston or Pino for better performance and features
    return JSON.stringify(logData);
  }

  info(message: string, context: LogContext, metadata?: LogMetadata): void {
    console.log(this.formatLog("info", message, context, metadata));
  }

  warn(message: string, context: LogContext, metadata?: LogMetadata): void {
    console.warn(this.formatLog("warn", message, context, metadata));
  }

  error(message: string, context: LogContext, metadata?: LogMetadata): void {
    console.error(this.formatLog("error", message, context, metadata));
  }

  /**
   * Log API request completion
   */
  logRequest(context: LogContext, metadata: LogMetadata): void {
    const level = metadata.status && metadata.status >= 500 ? "error" : "info";
    const message = `${context.method} ${context.path} - ${metadata.status}`;

    if (level === "error") {
      this.error(message, context, metadata);
    } else {
      this.info(message, context, metadata);
    }
  }

  /**
   * Log validation errors
   */
  logValidationError(
    context: LogContext,
    details: Record<string, any>
  ): void {
    this.warn("Validation error", context, {
      status: 400,
      details,
    });
  }

  /**
   * Log unexpected errors
   */
  logUnexpectedError(context: LogContext, error: Error): void {
    this.error("Unexpected error", context, {
      status: 500,
      error,
      details: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    });
  }
}

export const logger = new Logger();

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
