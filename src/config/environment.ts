/**
 * environment.ts - Centralized environment configuration for Gandall Healthcare Platform
 *
 * This provides a single source of truth for all environment variables,
 * with proper typing, validation, and defaults for the healthcare platform.
 * 
 * IMPORTANT: All sensitive values must be stored in .env.local (which is gitignored)
 * Use .env.template as a reference for required variables.
 */

import { createLogger } from '../utils/logger';

const logger = createLogger('Environment');

/**
 * Environment configuration interface
 * Defines all environment variables with their types
 */
interface EnvironmentConfig {
  // Application metadata
  NODE_ENV: 'development' | 'production' | 'test';
  APP_VERSION: string;

  // Feature flags
  ENABLE_DEBUG: boolean;
  ENABLE_OFFLINE_MODE: boolean;

  // API Configuration
  API_BASE_URL: string;
  API_TIMEOUT_MS: number;

  // Medplum FHIR Configuration
  MEDPLUM_BASE_URL: string;
  MEDPLUM_CLIENT_ID: string;
  MEDPLUM_PROJECT_ID: string;

  // Supabase Configuration for offline-first capabilities
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;

  // Cache Configuration
  CACHE_TTL_SECONDS: number;
  MAX_OFFLINE_CACHE_SIZE_MB: number;

  // Authentication
  AUTH_TOKEN_EXPIRY_DAYS: number;

  // Localization
  DEFAULT_LOCALE: string;
  SUPPORTED_LOCALES: string[];
}

/**
 * Get an environment variable with appropriate prefix handling
 */
function getEnvVar(key: string, defaultValue: string = ''): string {
  // Check for variables with different prefix patterns
  // This is especially important for Next.js which uses NEXT_PUBLIC_
  const nextPublicKey = `NEXT_PUBLIC_${key}`;
  const value = process.env[nextPublicKey] || process.env[key] || defaultValue;

  // In development mode, log when variables are missing or using defaults
  if (process.env.NODE_ENV === 'development') {
    if (value === defaultValue && defaultValue !== '') {
      logger.warn(`Using default value for ${key}: ${defaultValue}. Check your .env.local file.`);
    }
  }

  return value;
}

/**
 * Parse boolean environment variable
 */
function getBoolEnvVar(key: string, defaultValue: boolean): boolean {
  const value = getEnvVar(key, defaultValue.toString());
  return value.toLowerCase() === 'true';
}

/**
 * Parse number environment variable
 */
function getNumberEnvVar(key: string, defaultValue: number): number {
  const value = getEnvVar(key, defaultValue.toString());
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse string array environment variable (comma-separated)
 */
function getArrayEnvVar(key: string, defaultValue: string[]): string[] {
  const value = getEnvVar(key, defaultValue.join(','));
  return value ? value.split(',').map(item => item.trim()) : defaultValue;
}

// Get NODE_ENV first to avoid circular reference
const NODE_ENV = (getEnvVar('NODE_ENV', 'development') as EnvironmentConfig['NODE_ENV']);

/**
 * Environment configuration object
 * Contains all environment variables with their parsed values
 */
const env: EnvironmentConfig = {
  // Application metadata
  NODE_ENV,
  APP_VERSION: getEnvVar('APP_VERSION', '0.1.0'),

  // Feature flags
  ENABLE_DEBUG: getBoolEnvVar('ENABLE_DEBUG', NODE_ENV !== 'production'),
  ENABLE_OFFLINE_MODE: getBoolEnvVar('ENABLE_OFFLINE_MODE', true),

  // API Configuration
  API_BASE_URL: getEnvVar('API_BASE_URL', '/api'),
  API_TIMEOUT_MS: getNumberEnvVar('API_TIMEOUT_MS', 30000),

  // Medplum FHIR Configuration for healthcare platform
  // In Next.js, client-side code can only access variables prefixed with NEXT_PUBLIC_
  MEDPLUM_BASE_URL: process.env.NEXT_PUBLIC_MEDPLUM_BASE_URL || 'https://api.medplum.com',
  MEDPLUM_CLIENT_ID: process.env.NEXT_PUBLIC_MEDPLUM_CLIENT_ID || '',
  MEDPLUM_PROJECT_ID: process.env.NEXT_PUBLIC_MEDPLUM_PROJECT_ID || '',

  // Add Supabase configuration for offline-first capabilities
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',

  // Cache Configuration for offline-first capability
  CACHE_TTL_SECONDS: getNumberEnvVar('CACHE_TTL_SECONDS', 86400), // 24 hours
  MAX_OFFLINE_CACHE_SIZE_MB: getNumberEnvVar('MAX_OFFLINE_CACHE_SIZE_MB', 50),

  // Authentication
  AUTH_TOKEN_EXPIRY_DAYS: getNumberEnvVar('AUTH_TOKEN_EXPIRY_DAYS', 14),

  // Localization for French and English support
  DEFAULT_LOCALE: getEnvVar('DEFAULT_LOCALE', 'en'),
  SUPPORTED_LOCALES: getArrayEnvVar('SUPPORTED_LOCALES', ['en', 'fr']),
};

// Log environment configuration in development with sensitive data masked
if (NODE_ENV === 'development') {
  // Add detailed debugging to help identify environment variable loading issues
  logger.debug('Raw Next.js environment variables:', {
    NEXT_PUBLIC_MEDPLUM_BASE_URL: process.env.NEXT_PUBLIC_MEDPLUM_BASE_URL || '<not set>',
    NEXT_PUBLIC_MEDPLUM_CLIENT_ID: process.env.NEXT_PUBLIC_MEDPLUM_CLIENT_ID || '<not set>',
    NEXT_PUBLIC_MEDPLUM_PROJECT_ID: process.env.NEXT_PUBLIC_MEDPLUM_PROJECT_ID || '<not set>',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '<not set>',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '****' : '<not set>',
    NODE_ENV: process.env.NODE_ENV || '<not set>',
  });

  // Log the resolved configuration values
  logger.debug('Environment configuration loaded', {
    NODE_ENV: env.NODE_ENV,
    APP_VERSION: env.APP_VERSION,
    ENABLE_DEBUG: env.ENABLE_DEBUG,
    ENABLE_OFFLINE_MODE: env.ENABLE_OFFLINE_MODE,
    API_BASE_URL: env.API_BASE_URL,
    MEDPLUM_BASE_URL: env.MEDPLUM_BASE_URL,
    // Mask sensitive values for security
    MEDPLUM_CLIENT_ID: env.MEDPLUM_CLIENT_ID ? '****' : '<not set>',
    SUPABASE_URL: env.SUPABASE_URL,
    SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY ? '****' : '<not set>',
  });
}

/**
 * Get a readonly copy of the environment configuration
 */
export function getConfig(): Readonly<EnvironmentConfig> {
  return Object.freeze({ ...env });
}

// Export environment values with explicit names

// Environment status
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Feature flags
export const isDebugEnabled = env.ENABLE_DEBUG;
export const isOfflineModeEnabled = env.ENABLE_OFFLINE_MODE;

// API configuration
export const apiBaseUrl = env.API_BASE_URL;
export const apiTimeout = env.API_TIMEOUT_MS;

// FHIR server configuration
export const medplumBaseUrl = env.MEDPLUM_BASE_URL;
export const medplumClientId = env.MEDPLUM_CLIENT_ID;
export const medplumProjectId = env.MEDPLUM_PROJECT_ID;

// Supabase configuration
export const supabaseUrl = env.SUPABASE_URL;
export const supabaseAnonKey = env.SUPABASE_ANON_KEY;

// Offline-first cache configuration
export const cacheTtlSeconds = env.CACHE_TTL_SECONDS;
export const maxOfflineCacheSizeMb = env.MAX_OFFLINE_CACHE_SIZE_MB;

// Authentication configuration
export const authTokenExpiryDays = env.AUTH_TOKEN_EXPIRY_DAYS;

// Localization configuration
export const defaultLocale = env.DEFAULT_LOCALE;
export const supportedLocales = env.SUPPORTED_LOCALES;

// Default export for the entire config
export default env;
