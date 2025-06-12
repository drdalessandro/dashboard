/**
 * useBaseCRUD.ts
 * 
 * Base hook providing generic CRUD operations for FHIR resources
 * Uses the core services to eliminate duplication across resource hooks
 * Provides consistent patterns for create, read, update, delete operations
 */

import React from 'react';
import { Resource, ResourceType } from '@medplum/fhirtypes';
import { useMedplum } from '../useMedplum';
import {
  connectionService,
  cacheService,
  errorService,
  SyncService,
  type CategorizedError
} from '../../services/medplum';
import { createLogger } from '../../utils/logger';

// Initialize logger
const logger = createLogger('useBaseCRUD');

export interface BaseCRUDOptions<T extends Resource = Resource> {
  resourceType: ResourceType;
  onSuccess?: (resource: T | T[]) => void;
  onError?: (error: CategorizedError) => void;
  enableOffline?: boolean;
  enableCache?: boolean;
  cacheTTL?: number;
}

export interface BaseCRUDState<T extends Resource = Resource> {
  data: T | T[] | null;
  isLoading: boolean;
  error: CategorizedError | null;
  isOffline: boolean;
  hasPendingChanges: boolean;
}

export interface BaseCRUDOperations<T extends Resource = Resource> {
  // Read operations
  fetchOne: (id: string) => Promise<T>;
  fetchMany: (options?: { filters?: any; pagination?: any; sort?: any }) => Promise<T[]>;
  search: (query: Record<string, any>) => Promise<T[]>;

  // Write operations
  create: (data: Partial<T>) => Promise<T>;
  update: (id: string, data: Partial<T>) => Promise<T>;
  delete: (id: string) => Promise<void>;

  // Utility operations
  refetch: () => Promise<void>;
  clearCache: () => void;
  syncPending: () => Promise<void>;
}

/**
 * Base CRUD hook for FHIR resources
 */
export interface BaseCRUDOptions<T extends Resource = Resource> {
  resourceType: ResourceType;
  onSuccess?: (data: T | T[]) => void;
  onError?: (error: CategorizedError) => void;
  enableOffline?: boolean;
  enableCache?: boolean;
  cacheTTL?: number;
}

export function useBaseCRUD<T extends Resource = Resource>(
  options: BaseCRUDOptions<T>
): BaseCRUDState<T> & BaseCRUDOperations<T> {
  const {
    resourceType,
    onSuccess,
    onError,
    enableOffline = true,
    enableCache = true,
    cacheTTL = 24 * 60 * 60 * 1000 // 24 hours
  } = options;
  // resourceType is now strictly typed as ResourceType

  const medplum = useMedplum();
  const [state, setState] = React.useState<BaseCRUDState<T>>({
    data: null,
    isLoading: false,
    error: null,
    isOffline: !connectionService.isConnected(),
    hasPendingChanges: false
  });

  // Create sync service instance
  const syncService = React.useMemo(() =>
    new SyncService(medplum, { maxRetries: 3, batchSize: 10 })
    , [medplum]);

  // Update offline state when connection changes
  React.useEffect(() => {
    const unsubscribe = connectionService.subscribe((connectionState) => {
      setState(prev => ({
        ...prev,
        isOffline: !connectionState.isOnline || !connectionState.isServerAvailable,
        hasPendingChanges: syncService.hasPendingOperations()
      }));
    });

    return unsubscribe;
  }, [syncService]);

  /**
   * Handle errors consistently
   */
  const handleError = React.useCallback((error: any, context?: Record<string, any>) => {
    const categorizedError = errorService.categorizeError(error, {
      ...context,
      resourceType,
      operation: context?.operation || 'unknown'
    });

    setState(prev => ({ ...prev, error: categorizedError, isLoading: false }));

    if (onError) {
      onError(categorizedError);
    }

    return categorizedError;
  }, [resourceType, onError]);

  /**
   * Handle successful operations
   */
  const handleSuccess = React.useCallback((data: T | T[]) => {
    setState(prev => ({ ...prev, data, error: null, isLoading: false }));

    if (onSuccess) {
      onSuccess(data);
    }
  }, [onSuccess]);

  /**
   * Fetch a single resource by ID
   */
  const fetchOne = React.useCallback(async (id: string): Promise<T> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      logger.debug(`Fetching ${resourceType}/${id}`);

      // Check cache first if enabled
      if (enableCache) {
        const cached = cacheService.getCachedResource<T>(resourceType, id);
        if (cached) {
          logger.debug(`Cache hit for ${resourceType}/${id}`);
          const result = cached as T;
          handleSuccess(result);
          return result;
        }
      }

      // Check if we're online
      if (!connectionService.isConnected()) {
        throw new Error(`Cannot fetch ${resourceType}/${id} while offline and not cached`);
      }

      const resource = await medplum.readResource(resourceType, id) as T;

      // Cache the result if enabled
      if (enableCache && resource) {
        cacheService.cacheResource(resource);
      }

      handleSuccess(resource);
      return resource;

    } catch (error) {
      const categorizedError = handleError(error, { operation: 'fetchOne', resourceId: id });
      throw categorizedError;
    }
  }, [resourceType, enableCache, medplum, handleSuccess, handleError]);

  /**
   * Fetch multiple resources with options
   */
  const fetchMany = React.useCallback(async (options: {
    filters?: any;
    pagination?: any;
    sort?: any
  } = {}): Promise<T[]> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      logger.debug(`Fetching ${resourceType} resources`, options);

      // Generate cache key for list
      const cacheKey = JSON.stringify(options);

      // Check cache first if enabled
      if (enableCache) {
        const cached = cacheService.getCachedResourceList<T>(resourceType, cacheKey);
        if (cached) {
          logger.debug(`Cache hit for ${resourceType} list`);
          handleSuccess(cached);
          return cached;
        }
      }

      // Check if we're online
      if (!connectionService.isConnected()) {
        throw new Error(`Cannot fetch ${resourceType} resources while offline and not cached`);
      }

      const resources = await medplum.fetchResources<T>(resourceType, options);

      // Cache the results if enabled
      if (enableCache && resources.length > 0) {
        cacheService.cacheResourceList(resourceType, resources, cacheKey);
      }

      handleSuccess(resources);
      return resources;

    } catch (error) {
      const categorizedError = handleError(error, { operation: 'fetchMany', options });
      throw categorizedError;
    }
  }, [resourceType, enableCache, medplum, handleSuccess, handleError]);

  /**
   * Search resources with query parameters
   */
  const search = React.useCallback(async (query: Record<string, any>): Promise<T[]> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      logger.debug(`Searching ${resourceType} resources`, query);

      // Check if we're online
      if (!connectionService.isConnected()) {
        throw new Error(`Cannot search ${resourceType} resources while offline`);
      }

      let resources: T[];

      try {
        // OPTION 1: Try using the standard search method first
        if (typeof medplum.search === 'function') {
          logger.debug('Using medplum.search method');
          const searchResult = await medplum.search(resourceType, query);
          resources = searchResult.entry?.map((entry: any) => entry.resource) || [];
        } else if (typeof medplum.searchResources === 'function') {
          // OPTION 2: Fallback to searchResources method if available
          logger.debug('search method not available, trying searchResources');
          resources = await medplum.searchResources(resourceType, query) as unknown as T[];
        } else {
          // OPTION 3: Use fetchResources as final fallback
          logger.debug('searchResources not available, using fetchResources');
          resources = await medplum.fetchResources<T>(resourceType, { filters: query });
        }
      } catch (searchError) {
        // Enhanced error handling for different types of search failures
        const errorMessage = searchError instanceof Error ? searchError.message : String(searchError);
        
        if (errorMessage.includes('searchResources is not a function')) {
          logger.warn('searchResources method not available, falling back to fetchResources');
          resources = await medplum.fetchResources<T>(resourceType, { filters: query });
        } else {
          throw searchError;
        }
      }

      handleSuccess(resources);
      return resources;

    } catch (error) {
      const categorizedError = handleError(error, { operation: 'search', query, resourceType });
      throw categorizedError;
    }
  }, [resourceType, medplum, handleSuccess, handleError]);

  /**
   * Create a new resource
   */
  const create = React.useCallback(async (data: Partial<T>): Promise<T> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      logger.debug(`Creating ${resourceType} resource`);

      const resourceData = {
        ...data,
        resourceType
      } as T;

      let result: T;

      if (connectionService.isConnected()) {
        // Online: create directly
        result = await medplum.createResource<T>(resourceData);

        // Cache the result
        if (enableCache) {
          cacheService.cacheResource(result);
        }
      } else if (enableOffline) {
        // Offline: queue for sync
        const operationId = syncService.queueCreate(resourceType, resourceData);

        // Create temporary resource for UI
        result = {
          ...resourceData,
          id: `temp-${Date.now()}`,
          _tempId: true,
          _operationId: operationId
        } as T;

        setState(prev => ({ ...prev, hasPendingChanges: true }));
      } else {
        throw new Error(`Cannot create ${resourceType} while offline`);
      }

      handleSuccess(result);
      return result;

    } catch (error) {
      const categorizedError = handleError(error, { operation: 'create', data });
      throw categorizedError;
    }
  }, [resourceType, enableOffline, enableCache, medplum, syncService, handleSuccess, handleError]);

  /**
   * Update an existing resource
   */
  const update = React.useCallback(async (id: string, data: Partial<T>): Promise<T> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      logger.debug(`Updating ${resourceType}/${id}`);

      const resourceData = {
        ...data,
        id,
        resourceType
      } as T;

      let result: T;

      if (connectionService.isConnected()) {
        // Online: update directly
        result = await medplum.updateResource<T>(resourceData);

        // Update cache
        if (enableCache) {
          cacheService.cacheResource(result);
        }
      } else if (enableOffline) {
        // Offline: queue for sync
        syncService.queueUpdate(resourceType, id, resourceData);

        // Update local cache for UI
        if (enableCache) {
          cacheService.cacheResource(resourceData);
        }

        result = resourceData;
        setState(prev => ({ ...prev, hasPendingChanges: true }));
      } else {
        throw new Error(`Cannot update ${resourceType}/${id} while offline`);
      }

      handleSuccess(result);
      return result;

    } catch (error) {
      const categorizedError = handleError(error, { operation: 'update', resourceId: id, data });
      throw categorizedError;
    }
  }, [resourceType, enableOffline, enableCache, medplum, syncService, handleSuccess, handleError]);

  /**
   * Delete a resource
   */
  const deleteResource = React.useCallback(async (id: string): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      logger.debug(`Deleting ${resourceType}/${id}`);

      if (connectionService.isConnected()) {
        // Online: delete directly
        await medplum.deleteResource(resourceType, id);

        // Remove from cache
        if (enableCache) {
          cacheService.delete(`${resourceType}.${id}`);
        }
      } else if (enableOffline) {
        // Offline: queue for sync
        syncService.queueDelete(resourceType, id);
        setState(prev => ({ ...prev, hasPendingChanges: true }));
      } else {
        throw new Error(`Cannot delete ${resourceType}/${id} while offline`);
      }

      setState(prev => ({ ...prev, data: null, isLoading: false, error: null }));

    } catch (error) {
      const categorizedError = handleError(error, { operation: 'delete', resourceId: id });
      throw categorizedError;
    }
  }, [resourceType, enableOffline, enableCache, medplum, syncService, handleError]);

  /**
   * Refetch current data
   */
  const refetch = React.useCallback(async (): Promise<void> => {
    if (Array.isArray(state.data)) {
      await fetchMany();
    } else if (state.data?.id) {
      await fetchOne(state.data.id);
    }
  }, [state.data, fetchMany, fetchOne]);

  /**
   * Clear cache for this resource type
   */
  const clearCache = React.useCallback((): void => {
    if (enableCache) {
      cacheService.invalidateResourceType(resourceType);
      logger.debug(`Cleared cache for ${resourceType}`);
    }
  }, [resourceType, enableCache]);

  /**
   * Sync pending operations
   */
  const syncPending = React.useCallback(async (): Promise<void> => {
    if (!enableOffline) return;

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      await syncService.syncPendingOperations();

      setState(prev => ({
        ...prev,
        hasPendingChanges: syncService.hasPendingOperations(),
        isLoading: false
      }));

      // Refetch data after sync
      await refetch();

    } catch (error) {
      handleError(error, { operation: 'syncPending' });
    }
  }, [enableOffline, syncService, refetch, handleError]);

  return {
    // State
    ...state,

    // Operations
    fetchOne,
    fetchMany,
    search,
    create,
    update,
    delete: deleteResource,
    refetch,
    clearCache,
    syncPending
  };
}

// Export hook with better name for external use
export { useBaseCRUD as useResourceCRUD };
