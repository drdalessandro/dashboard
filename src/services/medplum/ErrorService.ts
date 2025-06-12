/**
 * ErrorService.ts
 * 
 * Centralized error handling service for FHIR operations and application errors
 * Provides error categorization, user-friendly messages, and recovery strategies
 * Extracted from various hooks to improve consistency and maintainability
 */

import React from 'react';
import { createLogger } from '../../utils/logger';

// Initialize logger for this service
const logger = createLogger('ErrorService');

export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  RESOURCE_NOT_FOUND = 'resource_not_found',
  CONFLICT = 'conflict',
  SERVER_ERROR = 'server_error',
  CLIENT_ERROR = 'client_error',
  OFFLINE = 'offline',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface CategorizedError {
  originalError: Error;
  category: ErrorCategory;
  severity: ErrorSeverity;
  userMessage: string;
  technicalMessage: string;
  recoveryActions: string[];
  isRetryable: boolean;
  context?: Record<string, any>;
  timestamp: Date;
  id: string;
}

export interface ErrorRecoveryStrategy {
  category: ErrorCategory;
  shouldRetry: (error: CategorizedError, attemptCount: number) => boolean;
  getRetryDelay: (attemptCount: number) => number;
  maxRetries: number;
}

/**
 * Service for centralized error handling and categorization
 */
export class ErrorService {
  private errorHistory: CategorizedError[] = [];
  private maxHistorySize = 100;
  private recoveryStrategies: Map<ErrorCategory, ErrorRecoveryStrategy> = new Map();

  constructor() {
    this.setupDefaultRecoveryStrategies();
  }

  /**
   * Categorize and enhance an error with context and recovery information
   */
  public categorizeError(
    error: Error | any,
    context?: Record<string, any>
  ): CategorizedError {
    const category = this.determineCategory(error);
    const severity = this.determineSeverity(category, error);
    const userMessage = this.getUserFriendlyMessage(category, error);
    const technicalMessage = this.getTechnicalMessage(error);
    const recoveryActions = this.getRecoveryActions(category);
    const isRetryable = this.isRetryableError(category);

    const categorizedError: CategorizedError = {
      originalError: error instanceof Error ? error : new Error(String(error)),
      category,
      severity,
      userMessage,
      technicalMessage,
      recoveryActions,
      isRetryable,
      context,
      timestamp: new Date(),
      id: this.generateErrorId(),
    };

    // Log the error
    this.logError(categorizedError);

    // Store in history
    this.addToHistory(categorizedError);

    return categorizedError;
  }

  /**
   * Create a user-friendly error message based on categorized error
   */
  public createUserFriendlyError(
    error: CategorizedError,
    context?: string
  ): Error {
    const userMessage = error.userMessage || 'An error occurred';
    const technicalMessage = error.technicalMessage || 'Unknown error';
    const recoveryActions = error.recoveryActions || [];
    const isRetryable = error.isRetryable || false;
    const severity = error.severity || ErrorSeverity.MEDIUM;

    return new Error(
      `${userMessage}\n\nTechnical details:\n${technicalMessage}\n\nRecovery actions:\n${recoveryActions.join('\n')}`
    );
  }

  /**
   * Check if an error should be retried based on category and attempt count
   */
  public shouldRetry(error: CategorizedError, attemptCount: number): boolean {
    const strategy = this.recoveryStrategies.get(error.category);
    if (!strategy) return false;

    return strategy.shouldRetry(error, attemptCount);
  }

  /**
   * Get retry delay for an error category and attempt count
   */
  public getRetryDelay(error: CategorizedError, attemptCount: number): number {
    const strategy = this.recoveryStrategies.get(error.category);
    if (!strategy) return 1000; // Default 1 second

    return strategy.getRetryDelay(attemptCount);
  }

  /**
   * Get maximum retry attempts for an error category
   */
  public getMaxRetries(category: ErrorCategory): number {
    const strategy = this.recoveryStrategies.get(category);
    return strategy?.maxRetries || 0;
  }

  /**
   * Get recent error history
   */
  public getErrorHistory(limit?: number): CategorizedError[] {
    const recentErrors = [...this.errorHistory].reverse();
    return limit ? recentErrors.slice(0, limit) : recentErrors;
  }

  /**
   * Get error statistics
   */
  public getErrorStatistics(): Record<ErrorCategory, number> {
    const stats: Record<ErrorCategory, number> = {} as any;

    // Initialize all categories with 0
    Object.values(ErrorCategory).forEach(category => {
      stats[category] = 0;
    });

    // Count occurrences
    this.errorHistory.forEach(error => {
      stats[error.category]++;
    });

    return stats;
  }

  /**
   * Clear error history
   */
  public clearHistory(): void {
    this.errorHistory = [];
    logger.info('Error history cleared');
  }

  /**
   * Register custom recovery strategy
   */
  public registerRecoveryStrategy(category: ErrorCategory, strategy: ErrorRecoveryStrategy): void {
    this.recoveryStrategies.set(category, strategy);
    logger.debug(`Registered recovery strategy for category: ${category}`);
  }

  /**
   * Determine error category based on error characteristics
   */
  private determineCategory(error: any): ErrorCategory {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorName = error?.name?.toLowerCase() || '';
    const statusCode = error?.status || error?.statusCode;

    // Network-related errors
    if (errorMessage.includes('network') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('connection') ||
      errorName.includes('networkerror')) {
      return ErrorCategory.NETWORK;
    }

    // Authentication errors
    if (statusCode === 401 ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('authentication') ||
      errorMessage.includes('invalid token')) {
      return ErrorCategory.AUTHENTICATION;
    }

    // Authorization errors
    if (statusCode === 403 ||
      errorMessage.includes('forbidden') ||
      errorMessage.includes('access denied') ||
      errorMessage.includes('permission')) {
      return ErrorCategory.AUTHORIZATION;
    }

    // Not found errors
    if (statusCode === 404 ||
      errorMessage.includes('not found') ||
      errorMessage.includes('resource not found')) {
      return ErrorCategory.RESOURCE_NOT_FOUND;
    }

    // Validation errors
    if (statusCode === 400 ||
      errorMessage.includes('validation') ||
      errorMessage.includes('invalid') ||
      errorMessage.includes('bad request')) {
      return ErrorCategory.VALIDATION;
    }

    // Conflict errors
    if (statusCode === 409 ||
      errorMessage.includes('conflict') ||
      errorMessage.includes('duplicate')) {
      return ErrorCategory.CONFLICT;
    }

    // Server errors
    if (statusCode >= 500 ||
      errorMessage.includes('server error') ||
      errorMessage.includes('internal error')) {
      return ErrorCategory.SERVER_ERROR;
    }

    // Client errors
    if (statusCode >= 400 && statusCode < 500) {
      return ErrorCategory.CLIENT_ERROR;
    }

    // Timeout errors
    if (errorMessage.includes('timeout') ||
      errorMessage.includes('timed out')) {
      return ErrorCategory.TIMEOUT;
    }

    // Offline errors
    if (errorMessage.includes('offline') ||
      errorMessage.includes('no internet') ||
      !navigator.onLine) {
      return ErrorCategory.OFFLINE;
    }

    return ErrorCategory.UNKNOWN;
  }

  /**
   * Determine error severity based on category and context
   */
  private determineSeverity(category: ErrorCategory, error: any): ErrorSeverity {
    switch (category) {
      case ErrorCategory.AUTHENTICATION:
      case ErrorCategory.SERVER_ERROR:
        return ErrorSeverity.HIGH;

      case ErrorCategory.AUTHORIZATION:
      case ErrorCategory.CONFLICT:
        return ErrorSeverity.MEDIUM;

      case ErrorCategory.NETWORK:
      case ErrorCategory.TIMEOUT:
      case ErrorCategory.OFFLINE:
        return ErrorSeverity.MEDIUM;

      case ErrorCategory.VALIDATION:
      case ErrorCategory.CLIENT_ERROR:
        return ErrorSeverity.LOW;

      case ErrorCategory.RESOURCE_NOT_FOUND:
        return ErrorSeverity.LOW;

      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(category: ErrorCategory, error: any): string {
    const messages: Record<ErrorCategory, string> = {
      [ErrorCategory.NETWORK]: 'Connection problem. Please check your internet connection and try again.',
      [ErrorCategory.AUTHENTICATION]: 'Please log in again to continue.',
      [ErrorCategory.AUTHORIZATION]: 'You do not have permission to perform this action.',
      [ErrorCategory.RESOURCE_NOT_FOUND]: 'The requested information could not be found.',
      [ErrorCategory.VALIDATION]: 'Please check your information and try again.',
      [ErrorCategory.CONFLICT]: 'This information conflicts with existing data. Please refresh and try again.',
      [ErrorCategory.SERVER_ERROR]: 'Server is temporarily unavailable. Please try again later.',
      [ErrorCategory.CLIENT_ERROR]: 'There was a problem with your request. Please try again.',
      [ErrorCategory.OFFLINE]: 'You are currently offline. Changes will be saved when connection is restored.',
      [ErrorCategory.TIMEOUT]: 'The request timed out. Please try again.',
      [ErrorCategory.UNKNOWN]: 'An unexpected error occurred. Please try again.',
    };

    return messages[category] || messages[ErrorCategory.UNKNOWN];
  }

  /**
   * Get technical error message for debugging
   */
  private getTechnicalMessage(error: any): string {
    if (error instanceof Error) {
      return `${error.name}: ${error.message}`;
    }

    if (typeof error === 'object' && error !== null) {
      return JSON.stringify(error, null, 2);
    }

    return String(error);
  }

  /**
   * Get recovery actions for error category
   */
  private getRecoveryActions(category: ErrorCategory): string[] {
    const actions: Record<ErrorCategory, string[]> = {
      [ErrorCategory.NETWORK]: [
        'Check internet connection',
        'Try again in a few moments',
        'Switch to offline mode if available'
      ],
      [ErrorCategory.AUTHENTICATION]: [
        'Log in again',
        'Clear browser cache',
        'Contact administrator if problem persists'
      ],
      [ErrorCategory.AUTHORIZATION]: [
        'Contact administrator for access',
        'Verify you have the correct permissions',
        'Log out and log back in'
      ],
      [ErrorCategory.RESOURCE_NOT_FOUND]: [
        'Refresh the page',
        'Check if the item still exists',
        'Navigate back and try again'
      ],
      [ErrorCategory.VALIDATION]: [
        'Check all required fields',
        'Verify data format is correct',
        'Remove any special characters'
      ],
      [ErrorCategory.CONFLICT]: [
        'Refresh the page',
        'Check for recent changes',
        'Try again with updated information'
      ],
      [ErrorCategory.SERVER_ERROR]: [
        'Wait a few minutes and try again',
        'Contact support if problem persists',
        'Save your work offline if possible'
      ],
      [ErrorCategory.CLIENT_ERROR]: [
        'Double-check your input',
        'Try refreshing the page',
        'Clear browser cache'
      ],
      [ErrorCategory.OFFLINE]: [
        'Check internet connection',
        'Continue working offline',
        'Changes will sync when online'
      ],
      [ErrorCategory.TIMEOUT]: [
        'Try again with a stronger connection',
        'Reduce the size of your request',
        'Try again later'
      ],
      [ErrorCategory.UNKNOWN]: [
        'Try refreshing the page',
        'Contact support with error details',
        'Try again later'
      ]
    };

    return actions[category] || actions[ErrorCategory.UNKNOWN];
  }

  /**
   * Check if error category is retryable
   */
  private isRetryableError(category: ErrorCategory): boolean {
    const retryableCategories = [
      ErrorCategory.NETWORK,
      ErrorCategory.SERVER_ERROR,
      ErrorCategory.TIMEOUT,
      ErrorCategory.OFFLINE
    ];

    return retryableCategories.includes(category);
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log error with appropriate level
   */
  private logError(error: CategorizedError): void {
    const logContext = {
      id: error.id,
      category: error.category,
      severity: error.severity,
      context: error.context,
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        logger.error(error.technicalMessage, logContext);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn(error.technicalMessage, logContext);
        break;
      case ErrorSeverity.LOW:
        logger.info(error.technicalMessage, logContext);
        break;
    }
  }

  /**
   * Add error to history with size management
   */
  private addToHistory(error: CategorizedError): void {
    this.errorHistory.push(error);

    // Maintain history size limit
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Setup default recovery strategies
   */
  private setupDefaultRecoveryStrategies(): void {
    // Network errors - exponential backoff
    this.registerRecoveryStrategy(ErrorCategory.NETWORK, {
      category: ErrorCategory.NETWORK,
      shouldRetry: (error, attemptCount) => attemptCount <= 3,
      getRetryDelay: (attemptCount) => Math.min(1000 * Math.pow(2, attemptCount), 10000),
      maxRetries: 3,
    });

    // Server errors - linear backoff
    this.registerRecoveryStrategy(ErrorCategory.SERVER_ERROR, {
      category: ErrorCategory.SERVER_ERROR,
      shouldRetry: (error, attemptCount) => attemptCount <= 2,
      getRetryDelay: (attemptCount) => 5000 * attemptCount,
      maxRetries: 2,
    });

    // Timeout errors - immediate retry once
    this.registerRecoveryStrategy(ErrorCategory.TIMEOUT, {
      category: ErrorCategory.TIMEOUT,
      shouldRetry: (error, attemptCount) => attemptCount <= 1,
      getRetryDelay: () => 1000,
      maxRetries: 1,
    });

    // Offline errors - no automatic retry
    this.registerRecoveryStrategy(ErrorCategory.OFFLINE, {
      category: ErrorCategory.OFFLINE,
      shouldRetry: () => false,
      getRetryDelay: () => 0,
      maxRetries: 0,
    });
  }
}

// Utility to ensure error is always an Error or null
export function toError(e: unknown): Error | null {
  if (!e) return null;
  if (e instanceof Error) return e;
  if (typeof e === 'object' && e !== null && 'message' in e) {
    return new Error((e as any).message);
  }
  return new Error('Unknown error');
}

// Singleton instance for use throughout the application
export const errorService = new ErrorService();

/**
 * React hook to use error service with component-level error tracking
 */
export function useErrorHandler() {
  const [errors, setErrors] = React.useState<CategorizedError[]>([]);

  const handleError = React.useCallback((error: Error | any, context?: Record<string, any>) => {
    const categorizedError = errorService.categorizeError(error, context);
    setErrors(prev => [categorizedError, ...prev.slice(0, 9)]); // Keep last 10 errors
    return categorizedError;
  }, []);

  const clearErrors = React.useCallback(() => {
    setErrors([]);
  }, []);

  const removeError = React.useCallback((errorId: string) => {
    setErrors(prev => prev.filter(error => error.id !== errorId));
  }, []);

  return {
    errors,
    handleError,
    clearErrors,
    removeError,
    errorService,
  };
}
