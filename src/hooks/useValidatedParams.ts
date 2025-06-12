/**
 * useValidatedParams.ts * 
 * Custom hook for safely extracting and validating route parameters from Next.js useParams()
 * Solves the issue where useParams() returns undefined during initial hydration
 * */
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { createLogger } from '../utils/logger';
const logger = createLogger('useValidatedParams');
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface ParamValidationResult<T = string> {
  value: T | null;
  isValid: boolean;
  isLoading: boolean;
  error: string | null;
  exists: boolean;
}

export interface ParamValidationConfig {
  validator?: (value: string) => boolean;
  validationError?: string;
  redirectOnError?: boolean; redirectUrl?: string;
  required?: boolean;
  transformer?: (value: string) => any;
}

const DEFAULT_CONFIG: Required<ParamValidationConfig> = {
  validator: (value: string) => UUID_REGEX.test(value),
  validationError: 'Invalid parameter format',
  redirectOnError: false,
  redirectUrl: '/',
  required: true,
  transformer: (value: string) => value,
};

/**
 * Custom hook for validating a single route parameter
 */
export function useValidatedParams<T = string>(
  paramName: string,
  config?: ParamValidationConfig
): ParamValidationResult<T> {
  const params = useParams();
  const router = useRouter();

  // FIXED: Deeply memoize mergedConfig to prevent infinite loops
  const mergedConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [
    config?.validator,
    config?.validationError,
    config?.redirectOnError,
    config?.redirectUrl,
    config?.required,
    config?.transformer
  ]);

  const [result, setResult] = useState<ParamValidationResult<T>>({
    value: null,
    isValid: false,
    isLoading: true,
    error: null,
    exists: false,
  });

  useEffect(() => {
    if (!params || Object.keys(params).length === 0) {
      setResult(prev => ({ ...prev, isLoading: true }));
      return;
    }

    const paramValue = params[paramName];

    // Inline validation logic to avoid circular dependencies
    let validationResult: ParamValidationResult<T>;

    if (paramValue === undefined || paramValue === null) {
      validationResult = {
        value: null,
        isValid: false,
        isLoading: false,
        error: mergedConfig.required ? `Parameter '${paramName}' is required` : null,
        exists: false,
      };
    } else {
      const stringValue = Array.isArray(paramValue) ? paramValue[0] : String(paramValue);
      const isValid = mergedConfig.validator(stringValue);

      if (!isValid) {
        validationResult = {
          value: null,
          isValid: false,
          isLoading: false,
          error: mergedConfig.validationError,
          exists: true,
        };
      } else {
        const transformedValue = mergedConfig.transformer(stringValue) as T;
        validationResult = {
          value: transformedValue,
          isValid: true,
          isLoading: false,
          error: null,
          exists: true,
        };
      }
    }

    // Only update if the result has actually changed
    setResult(prev => {
      if (
        prev.value === validationResult.value &&
        prev.isValid === validationResult.isValid &&
        prev.error === validationResult.error &&
        prev.exists === validationResult.exists
      ) {
        return prev; // No change, return previous state
      }
      return validationResult;
    });

    logger.debug(`Validating parameter '${paramName}'`, {
      paramValue,
      isValid: validationResult.isValid,
      error: validationResult.error,
    });

    if (!validationResult.isValid && mergedConfig.redirectOnError && validationResult.exists) {
      logger.warn(`Invalid parameter '${paramName}', redirecting to ${mergedConfig.redirectUrl}`);
      router.replace(mergedConfig.redirectUrl);
    }
  }, [params, paramName, mergedConfig, router]);

  return result;
}

/**
 * Hook for validating the 'id' parameter specifically
 * Proper function overloads to handle optional config parameter
 */
// Create a stable config object for useValidatedId
const ID_VALIDATION_CONFIG = {
  validator: (value: string) => UUID_REGEX.test(value),
  validationError: 'Invalid ID format - must be a valid UUID',
} as const;

export function useValidatedId(): ParamValidationResult;
export function useValidatedId(config: ParamValidationConfig): ParamValidationResult;
export function useValidatedId(config?: ParamValidationConfig): ParamValidationResult {
  const stableConfig = useMemo(() => ({
    ...ID_VALIDATION_CONFIG,
    ...config,
  }), [config]);

  return useValidatedParams('id', stableConfig);
}

/**
 * Utility functions
 */
export function areAllParamsValid(results: ParamValidationResult[]): boolean {
  return results.every(result => result.isValid && !result.isLoading);
}

export function areAnyParamsLoading(results: ParamValidationResult[]): boolean {
  return results.some(result => result.isLoading);
}

export function getFirstParamError(results: ParamValidationResult[]): string | null {
  const errorResult = results.find(result => result.error);
  return errorResult?.error || null;
}