/**
 * Simplified logger for auth endpoints
 * Auth endpoints don't always have full request context
 */

type LogLevel = 'info' | 'warn' | 'error';

interface SimpleLogContext {
  requestId: string;
  userId?: string;
  email?: string;
  error?: string;
  [key: string]: any;
}

function formatLog(level: LogLevel, message: string, context: SimpleLogContext): string {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    level,
    message,
    ...context,
  };
  return JSON.stringify(logData);
}

export const authLogger = {
  info(message: string, context: SimpleLogContext): void {
    console.log(formatLog('info', message, context));
  },

  warn(message: string, context: SimpleLogContext): void {
    console.warn(formatLog('warn', message, context));
  },

  error(message: string, context: SimpleLogContext): void {
    console.error(formatLog('error', message, context));
  },
};
