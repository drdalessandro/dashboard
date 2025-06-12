/**
 * Medplum Services Index
 * 
 * Centralized exports for all Medplum-related services
 * Created as part of Step 2: Extract Core Services refactoring
 */

import { cacheService, CacheService } from './CacheService';
import { connectionService, ConnectionService } from './ConnectionService';
import { errorService, ErrorService } from './ErrorService';
import { SyncService } from './SyncService';

// Core Services
export {
  ConnectionService,
  connectionService,
  useConnectionState,
  type ConnectionState,
  type ConnectionServiceOptions
} from './ConnectionService';

export {
  CacheService,
  cacheService,
  useCache,
  type CacheEntry,
  type CacheOptions,
  type StorageMetrics
} from './CacheService';

export {
  SyncService,
  type PendingOperation,
  type SyncProgress,
  type SyncOptions
} from './SyncService';

export {
  ErrorService,
  errorService,
  useErrorHandler,
  ErrorCategory,
  ErrorSeverity,
  type CategorizedError,
  type ErrorRecoveryStrategy
} from './ErrorService';

// Service factory for creating configured service instances
export function createMedplumServices(medplumClient: any, options: {
  connection?: { checkInterval?: number; retryAttempts?: number };
  cache?: { ttl?: number; maxSize?: number };
  sync?: { maxRetries?: number; batchSize?: number };
} = {}) {
  const connectionService = new ConnectionService(options.connection);
  const cacheService = new CacheService(options.cache);
  const syncService = new SyncService(medplumClient, options.sync);
  const errorService = new ErrorService();

  return {
    connectionService,
    cacheService,
    syncService,
    errorService,
  };
}

// Default service instances (singletons)
export const medplumServices = {
  connection: connectionService,
  cache: cacheService,
  error: errorService,
  // Note: syncService requires medplumClient, so it's created per hook
};
