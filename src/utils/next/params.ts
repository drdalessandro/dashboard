/**
 * Utility functions for handling Next.js params
 * These utilities help with Next.js 14+ params unwrapping
 */
import React from 'react';

/**
 * Safely unwraps a Next.js params object which may be a Promise in Next.js 14+
 * 
 * @param params The params object from a Next.js page component
 * @returns The unwrapped params object
 */
export function unwrapParams<T>(params: Promise<T> | T): T {
  // Check if params is a Promise by looking for the 'then' method
  if (params && typeof params === 'object' && 'then' in params) {
    // Unwrap the Promise using React.use
    return React.use(params);
  }
  
  // Return as-is if it's not a Promise
  return params;
}

/**
 * Gets a specific param value from a Next.js params object, handling Promise unwrapping
 * 
 * @param params The params object from a Next.js page component
 * @param key The key of the param to extract
 * @returns The value of the specified param
 */
export function getParam<T extends Record<string, any>, K extends keyof T>(
  params: Promise<T> | T, 
  key: K
): T[K] {
  const unwrappedParams = unwrapParams(params);
  return unwrappedParams[key];
}
