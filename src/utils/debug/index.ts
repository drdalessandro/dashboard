/**
 * Debug utilities package for Gandall Healthcare Platform
 * 
 * This package provides debugging tools that can be conditionally included
 * based on the environment. In production builds, these components will
 * be disabled or replaced with no-op implementations.
 */

import { createLogger, LogLevel } from '../logger';

const logger = createLogger('Debug');

// Environment configuration
export const isDevelopment = process.env.NODE_ENV !== 'production';
export const isDebugEnabled = isDevelopment || process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true';

// Debug state management
let debugEnabled = isDebugEnabled;

/**
 * Enable debug features at runtime
 */
export function enableDebug(): void {
  debugEnabled = true;
  logger.info('Debug mode enabled');
}

/**
 * Disable debug features at runtime
 */
export function disableDebug(): void {
  debugEnabled = false;
  logger.info('Debug mode disabled');
}

/**
 * Check if debug is currently enabled
 */
export function isDebugModeEnabled(): boolean {
  return debugEnabled;
}

/**
 * Debug utility that only executes in development or when debug is enabled
 * @param callback Function to execute if debugging is enabled
 */
export function debugOnly(callback: () => void): void {
  if (debugEnabled) {
    callback();
  }
}

/**
 * Safe JSON stringify with circular reference handling
 */
export function safeStringify(obj: any, indent = 2): string {
  const cache = new Set();

  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) {
        return '[Circular Reference]';
      }
      cache.add(value);
    }
    return value;
  }, indent);
}

// Import and re-export the error boundary component
// This ensures TypeScript can find the module properly
import { ErrorBoundary } from './ErrorBoundary';
export { ErrorBoundary };

// Import and re-export the network monitor component
import { NetworkMonitor } from './NetworkMonitor';
export { NetworkMonitor };

// Import and set up user debug utilities
import { setupUserDebugTools, initializeDefaultUser } from './userDebug';
export { setupUserDebugTools, initializeDefaultUser };

// Initialize user debug tools if debug is enabled
if (isDebugEnabled && typeof window !== 'undefined') {
  setupUserDebugTools();
  // Initialize a default user for development
  setTimeout(() => {
    // Delay to ensure DOM is loaded
    initializeDefaultUser();
  }, 1000);
}

// Re-export logger with debug namespace
export const debugLogger = createLogger('Debug', LogLevel.DEBUG);
