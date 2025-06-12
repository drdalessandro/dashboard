/**
 * ConnectionService.ts
 * 
 * Handles Medplum connection state, online/offline detection, and server availability
 * Extracted from useMedplum to improve separation of concerns and testability
 */

import { createLogger } from '../../utils/logger';
import { checkServerConnection, isServerConnected } from '../../lib/medplum/client';
import React from 'react';

// Initialize logger for this service
const logger = createLogger('ConnectionService');

export interface ConnectionState {
  isOnline: boolean;
  isServerAvailable: boolean;
  lastConnectionCheck: Date;
  connectionError: Error | null;
}

export interface ConnectionServiceOptions {
  checkInterval?: number; // Check interval in milliseconds, default 30000 (30 seconds)
  retryAttempts?: number; // Number of retry attempts, default 3
  retryDelay?: number; // Delay between retries in milliseconds, default 1000
}

/**
 * Service for managing connection state and server availability
 */
export class ConnectionService {
  private state: ConnectionState;
  private options: Required<ConnectionServiceOptions>;
  private checkIntervalId: NodeJS.Timeout | null = null;
  private listeners: Array<(state: ConnectionState) => void> = [];

  constructor(options: ConnectionServiceOptions = {}) {
    this.options = {
      checkInterval: options.checkInterval ?? 30000,
      retryAttempts: options.retryAttempts ?? 3,
      retryDelay: options.retryDelay ?? 1000,
    };

    this.state = {
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isServerAvailable: isServerConnected(),
      lastConnectionCheck: new Date(),
      connectionError: null,
    };

    this.setupBrowserListeners();
    this.startPeriodicChecks();
  }

  /**
   * Get current connection state
   */
  public getState(): ConnectionState {
    return { ...this.state };
  }

  /**
   * Check if currently online
   */
  public isOnline(): boolean {
    return this.state.isOnline;
  }

  /**
   * Check if server is available
   */
  public isServerAvailable(): boolean {
    return this.state.isServerAvailable;
  }

  /**
   * Check if fully connected (online AND server available)
   */
  public isConnected(): boolean {
    return this.state.isOnline && this.state.isServerAvailable;
  }

  /**
   * Get the last connection error
   */
  public getConnectionError(): Error | null {
    return this.state.connectionError;
  }

  /**
   * Manually trigger a connection check
   */
  public async checkConnection(): Promise<boolean> {
    try {
      logger.debug('Manually checking connection...');

      const isServerAvailable = await this.checkServerWithRetry();
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      this.updateState({
        isOnline,
        isServerAvailable,
        lastConnectionCheck: new Date(),
        connectionError: null,
      });

      logger.debug('Connection check completed', {
        isOnline,
        isServerAvailable,
        isConnected: this.isConnected()
      });

      return this.isConnected();
    } catch (error) {
      const connectionError = error instanceof Error ? error : new Error(String(error));

      logger.error('Connection check failed:', connectionError);

      this.updateState({
        ...this.state,
        isServerAvailable: false,
        lastConnectionCheck: new Date(),
        connectionError,
      });

      return false;
    }
  }

  /**
   * Subscribe to connection state changes
   */
  public subscribe(listener: (state: ConnectionState) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stopPeriodicChecks();
    this.removeBrowserListeners();
    this.listeners = [];
  }

  /**
   * Update connection state and notify listeners
   */
  private updateState(newState: Partial<ConnectionState>): void {
    const previousState = { ...this.state };
    this.state = { ...this.state, ...newState };

    // Notify listeners if state changed
    if (this.hasStateChanged(previousState, this.state)) {
      logger.debug('Connection state changed', {
        previous: previousState,
        current: this.state
      });

      this.listeners.forEach(listener => {
        try {
          listener(this.getState());
        } catch (error) {
          logger.error('Error in connection state listener:', error);
        }
      });
    }
  }

  /**
   * Check if connection state has meaningfully changed
   */
  private hasStateChanged(previous: ConnectionState, current: ConnectionState): boolean {
    return (
      previous.isOnline !== current.isOnline ||
      previous.isServerAvailable !== current.isServerAvailable ||
      previous.connectionError !== current.connectionError
    );
  }

  /**
   * Check server connection with retry logic
   */
  private async checkServerWithRetry(): Promise<boolean> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.options.retryAttempts; attempt++) {
      try {
        logger.debug(`Server connection attempt ${attempt}/${this.options.retryAttempts}`);

        const isAvailable = await checkServerConnection();

        if (isAvailable) {
          logger.debug('Server connection successful');
          return true;
        }

        logger.warn(`Server connection attempt ${attempt} failed - server not available`);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn(`Server connection attempt ${attempt} failed:`, lastError.message);
      }

      // Wait before retry (except on last attempt)
      if (attempt < this.options.retryAttempts) {
        await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
      }
    }

    // All attempts failed
    if (lastError) {
      throw lastError;
    }

    throw new Error('Server is not available after all retry attempts');
  }

  /**
   * Setup browser online/offline event listeners
   */
  private setupBrowserListeners(): void {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      logger.debug('Browser detected online');
      this.updateState({ isOnline: true });
      // Trigger server check when coming back online
      this.checkConnection();
    };

    const handleOffline = () => {
      logger.debug('Browser detected offline');
      this.updateState({
        isOnline: false,
        isServerAvailable: false,
        connectionError: new Error('Browser is offline')
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Store references for cleanup
    this.onlineHandler = handleOnline;
    this.offlineHandler = handleOffline;
  }

  // Store handler references for cleanup
  private onlineHandler: (() => void) | null = null;
  private offlineHandler: (() => void) | null = null;

  /**
   * Remove browser event listeners
   */
  private removeBrowserListeners(): void {
    if (typeof window === 'undefined') return;

    if (this.onlineHandler) {
      window.removeEventListener('online', this.onlineHandler);
      this.onlineHandler = null;
    }

    if (this.offlineHandler) {
      window.removeEventListener('offline', this.offlineHandler);
      this.offlineHandler = null;
    }
  }

  /**
   * Start periodic server availability checks
   */
  private startPeriodicChecks(): void {
    this.checkIntervalId = setInterval(() => {
      // Only check server if browser is online
      if (this.state.isOnline) {
        this.checkConnection().catch(error => {
          logger.error('Periodic connection check failed:', error);
        });
      }
    }, this.options.checkInterval);
  }

  /**
   * Stop periodic server checks
   */
  private stopPeriodicChecks(): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
  }
}

// Singleton instance for use throughout the application
export const connectionService = new ConnectionService();

/**
 * React hook to use connection service state
 */
export function useConnectionState() {
  const [state, setState] = React.useState<ConnectionState>(() => connectionService.getState());

  React.useEffect(() => {
    const unsubscribe = connectionService.subscribe(setState);
    return unsubscribe;
  }, []);

  return {
    ...state,
    isConnected: state.isOnline && state.isServerAvailable,
    checkConnection: () => connectionService.checkConnection(),
  };
}
