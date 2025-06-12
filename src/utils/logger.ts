/**
 * logger.ts - Centralized logging utility for Gandall Healthcare Platform
 * 
 * Features:
 * - Environment-aware logging (development vs production)
 * - Log levels (error, warn, info, debug)
 * - Module tagging
 * - No external dependencies to maintain offline-first capabilities
 */

// Log levels in order of severity
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

interface LoggerOptions {
  module: string;
  minLevel?: LogLevel;
}

// Default to different log levels based on environment
const DEFAULT_LOG_LEVEL = process.env.NODE_ENV === 'production' 
  ? LogLevel.WARN  // Only errors and warnings in production
  : LogLevel.DEBUG; // All logs in development

class Logger {
  private module: string;
  private minLevel: LogLevel;

  constructor(options: LoggerOptions) {
    this.module = options.module;
    this.minLevel = options.minLevel ?? DEFAULT_LOG_LEVEL;
  }

  /**
   * Format a log message with timestamp and module name
   */
  private format(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${this.module}] ${message}`;
  }

  /**
   * Check if a log level should be displayed based on current settings
   */
  private shouldLog(level: LogLevel): boolean {
    // Allow override via localStorage for debugging in production
    if (typeof window !== 'undefined') {
      const storedLevel = localStorage.getItem('gandall_log_level');
      if (storedLevel !== null) {
        const parsedLevel = parseInt(storedLevel, 10);
        if (!isNaN(parsedLevel)) {
          return level <= parsedLevel;
        }
      }
    }
    
    return level <= this.minLevel;
  }

  /**
   * Log error messages - always displayed
   */
  error(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const formattedMessage = this.format('ERROR', message);
      console.error(formattedMessage, ...args);
    }
  }

  /**
   * Log warning messages
   */
  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const formattedMessage = this.format('WARN', message);
      console.warn(formattedMessage, ...args);
    }
  }

  /**
   * Log informational messages
   */
  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const formattedMessage = this.format('INFO', message);
      console.info(formattedMessage, ...args);
    }
  }

  /**
   * Log debug messages - only in development by default
   */
  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const formattedMessage = this.format('DEBUG', message);
      console.debug(formattedMessage, ...args);
    }
  }

  /**
   * Measure performance of operations
   */
  time(label: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.time(`[${this.module}] ${label}`);
    }
  }

  /**
   * End performance measurement
   */
  timeEnd(label: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.timeEnd(`[${this.module}] ${label}`);
    }
  }
}

/**
 * Create a logger instance for a specific module
 */
export function createLogger(module: string, minLevel?: LogLevel): Logger {
  return new Logger({ module, minLevel });
}

/**
 * Set the global minimum log level
 * Can be used to enable debugging in production temporarily
 */
export function setLogLevel(level: LogLevel): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('gandall_log_level', level.toString());
  }
}

/**
 * Reset to default log level based on environment
 */
export function resetLogLevel(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('gandall_log_level');
  }
}
