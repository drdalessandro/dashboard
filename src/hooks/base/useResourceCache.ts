/**
 * useResourceCache.ts
 * 
 * Hook providing caching capabilities with sync support for FHIR resources
 * Uses CacheService to provide React-friendly caching patterns
 * Handles cache invalidation, synchronization, and resource-specific strategies
 */

import React from 'react';
import { Resource, ResourceType } from '@medplum/fhirtypes';
import { 
  cacheService, 
  connectionService,
  type StorageMetrics 
} from '../../services/medplum';
import { createLogger } from '../../utils/logger';

// Initialize logger
const logger = createLogger('useResourceCache');

export interface ResourceCacheOptions {
  resourceType: ResourceType;
  ttl?: number; // Time to live in milliseconds
  enableAutoCleanup?: boolean;
  maxCacheSize?: number;
  onCacheHit?: (key: string, data: any) => void;
  onCacheMiss?: (key: string) => void;
  onCacheInvalidated?: (resourceType: ResourceType, count: number) => void;
}

export interface CacheState {
  metrics: StorageMetrics;
  isCleaningUp: boolean;
  lastCleanup: Date | null;
  totalCacheHits: number;
  totalCacheMisses: number;
}

export interface CacheOperations<T extends Resource = Resource> {
  // Basic cache operations
  get: (key: string) => T | null;
  set: (key: string, data: T, ttl?: number) => boolean;
  delete: (key: string) => boolean;
  has: (key: string) => boolean;
  
  // Resource-specific operations
  cacheResource: (resource: T) => boolean;
  getCachedResource: (id: string) => T | null;
  cacheResourceList: (resources: T[], queryKey?: string) => boolean;
  getCachedResourceList: (queryKey: string) => T[] | null;
  
  // Cache management
  invalidateAll: () => number;
  invalidateResource: (id: string) => boolean;
  cleanup: () => Promise<number>;
  clear: () => boolean;
  
  // Statistics
  getHitRate: () => number;
  resetStats: () => void;
}

/**
 * Hook for resource-specific caching with sync capabilities
 */
export function useResourceCache<T extends Resource = Resource>(
  options: ResourceCacheOptions
): CacheState & CacheOperations<T> {
  const {
    resourceType,
    ttl = 24 * 60 * 60 * 1000, // 24 hours default
    enableAutoCleanup = true,
    maxCacheSize = 100,
    onCacheHit,
    onCacheMiss,
    onCacheInvalidated
  } = options;

  const [state, setState] = React.useState<CacheState>({
    metrics: cacheService.getMetrics(),
    isCleaningUp: false,
    lastCleanup: null,
    totalCacheHits: 0,
    totalCacheMisses: 0
  });

  // Update metrics periodically
  React.useEffect(() => {
    const updateMetrics = () => {
      setState(prev => ({
        ...prev,
        metrics: cacheService.getMetrics()
      }));
    };

    const interval = setInterval(updateMetrics, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Auto cleanup on mount and periodically
  React.useEffect(() => {
    if (!enableAutoCleanup) return;

    const performCleanup = async () => {
      setState(prev => ({ ...prev, isCleaningUp: true }));
      
      try {
        const deletedCount = cacheService.cleanup();
        setState(prev => ({
          ...prev,
          isCleaningUp: false,
          lastCleanup: new Date(),
          metrics: cacheService.getMetrics()
        }));

        if (deletedCount > 0) {
          logger.info(`Auto cleanup removed ${deletedCount} cache entries`);
        }
      } catch (error) {
        logger.error('Auto cleanup failed:', error);
        setState(prev => ({ ...prev, isCleaningUp: false }));
      }
    };

    // Initial cleanup
    performCleanup();

    // Periodic cleanup
    const interval = setInterval(performCleanup, 60 * 60 * 1000); // Every hour
    return () => clearInterval(interval);
  }, [enableAutoCleanup]);

  // Invalidate cache when connection is restored
  React.useEffect(() => {
    const unsubscribe = connectionService.subscribe((connectionState) => {
      if (connectionState.isOnline && connectionState.isServerAvailable) {
        logger.debug(`Connection restored, considering cache invalidation for ${resourceType}`);
        // Could implement selective invalidation based on age here
      }
    });

    return unsubscribe;
  }, [resourceType]);

  /**
   * Generate full cache key for resource type
   */
  const getFullKey = React.useCallback((key: string): string => {
    return `${resourceType}.${key}`;
  }, [resourceType]);

  /**
   * Update cache statistics
   */
  const updateStats = React.useCallback((hit: boolean, key: string, data?: any) => {
    setState(prev => ({
      ...prev,
      totalCacheHits: hit ? prev.totalCacheHits + 1 : prev.totalCacheHits,
      totalCacheMisses: hit ? prev.totalCacheMisses : prev.totalCacheMisses + 1
    }));

    if (hit && onCacheHit) {
      onCacheHit(key, data);
    } else if (!hit && onCacheMiss) {
      onCacheMiss(key);
    }
  }, [onCacheHit, onCacheMiss]);

  /**
   * Get cached data with statistics tracking
   */
  const get = React.useCallback((key: string): T | null => {
    const fullKey = getFullKey(key);
    const data = cacheService.get<T>(fullKey);
    const hit = data !== null;
    
    updateStats(hit, key, data);
    
    logger.debug(`Cache ${hit ? 'hit' : 'miss'} for ${fullKey}`);
    return data;
  }, [getFullKey, updateStats]);

  /**
   * Set cached data
   */
  const set = React.useCallback((key: string, data: T, cacheTTL?: number): boolean => {
    const fullKey = getFullKey(key);
    const success = cacheService.set(fullKey, data, cacheTTL || ttl);
    
    if (success) {
      logger.debug(`Cached data for ${fullKey}`);
      setState(prev => ({ ...prev, metrics: cacheService.getMetrics() }));
    }
    
    return success;
  }, [getFullKey, ttl]);

  /**
   * Delete cached data
   */
  const deleteCache = React.useCallback((key: string): boolean => {
    const fullKey = getFullKey(key);
    const success = cacheService.delete(fullKey);
    
    if (success) {
      logger.debug(`Deleted cache for ${fullKey}`);
      setState(prev => ({ ...prev, metrics: cacheService.getMetrics() }));
    }
    
    return success;
  }, [getFullKey]);

  /**
   * Check if key exists in cache
   */
  const has = React.useCallback((key: string): boolean => {
    const fullKey = getFullKey(key);
    return cacheService.has(fullKey);
  }, [getFullKey]);

  /**
   * Cache a FHIR resource
   */
  const cacheResource = React.useCallback((resource: T): boolean => {
    if (!resource.id) {
      logger.warn('Cannot cache resource without ID', resource);
      return false;
    }

    return set(resource.id, resource);
  }, [set]);

  /**
   * Get cached FHIR resource by ID
   */
  const getCachedResource = React.useCallback((id: string): T | null => {
    return get(id);
  }, [get]);

  /**
   * Cache a list of FHIR resources
   */
  const cacheResourceList = React.useCallback((
    resources: T[], 
    queryKey?: string
  ): boolean => {
    try {
      // Cache individual resources
      let individualSuccess = true;
      for (const resource of resources) {
        if (!cacheResource(resource)) {
          individualSuccess = false;
        }
      }

      // Cache the list itself if queryKey provided
      let listSuccess = true;
      if (queryKey) {
        const listKey = `list.${queryKey}`;
        listSuccess = set(listKey, resources as any, ttl / 2); // Shorter TTL for lists
      }

      return individualSuccess && listSuccess;
    } catch (error) {
      logger.error('Error caching resource list:', error);
      return false;
    }
  }, [cacheResource, set, ttl]);

  /**
   * Get cached resource list
   */
  const getCachedResourceList = React.useCallback((queryKey: string): T[] | null => {
    const listKey = `list.${queryKey}`;
    return get(listKey) as T[] | null;
  }, [get]);

  /**
   * Invalidate all cached resources of this type
   */
  const invalidateAll = React.useCallback((): number => {
    const deletedCount = cacheService.invalidateResourceType(resourceType);
    
    setState(prev => ({ ...prev, metrics: cacheService.getMetrics() }));
    
    if (onCacheInvalidated) {
      onCacheInvalidated(resourceType, deletedCount);
    }
    
    logger.info(`Invalidated ${deletedCount} cache entries for ${resourceType}`);
    return deletedCount;
  }, [resourceType, onCacheInvalidated]);

  /**
   * Invalidate specific resource
   */
  const invalidateResource = React.useCallback((id: string): boolean => {
    return deleteCache(id);
  }, [deleteCache]);

  /**
   * Perform cache cleanup
   */
  const cleanup = React.useCallback(async (): Promise<number> => {
    setState(prev => ({ ...prev, isCleaningUp: true }));
    
    try {
      const deletedCount = cacheService.cleanup();
      
      setState(prev => ({
        ...prev,
        isCleaningUp: false,
        lastCleanup: new Date(),
        metrics: cacheService.getMetrics()
      }));

      logger.info(`Manual cleanup removed ${deletedCount} cache entries`);
      return deletedCount;
    } catch (error) {
      logger.error('Manual cleanup failed:', error);
      setState(prev => ({ ...prev, isCleaningUp: false }));
      throw error;
    }
  }, []);

  /**
   * Clear all cache entries
   */
  const clear = React.useCallback((): boolean => {
    const success = cacheService.clear();
    
    if (success) {
      setState(prev => ({
        ...prev,
        metrics: cacheService.getMetrics(),
        totalCacheHits: 0,
        totalCacheMisses: 0
      }));
      
      logger.info('Cleared all cache entries');
    }
    
    return success;
  }, []);

  /**
   * Calculate cache hit rate
   */
  const getHitRate = React.useCallback((): number => {
    const { totalCacheHits, totalCacheMisses } = state;
    const total = totalCacheHits + totalCacheMisses;
    
    return total > 0 ? (totalCacheHits / total) * 100 : 0;
  }, [state.totalCacheHits, state.totalCacheMisses]);

  /**
   * Reset statistics
   */
  const resetStats = React.useCallback((): void => {
    setState(prev => ({
      ...prev,
      totalCacheHits: 0,
      totalCacheMisses: 0
    }));
    
    logger.info('Reset cache statistics');
  }, []);

  return {
    // State
    ...state,
    
    // Basic operations
    get,
    set,
    delete: deleteCache,
    has,
    
    // Resource operations
    cacheResource,
    getCachedResource,
    cacheResourceList,
    getCachedResourceList,
    
    // Management operations
    invalidateAll,
    invalidateResource,
    cleanup,
    clear,
    
    // Statistics
    getHitRate,
    resetStats
  };
}

/**
 * Simplified hook for basic resource caching
 */
export function useSimpleResourceCache<T extends Resource = Resource>(
  resourceType: ResourceType,
  ttl?: number
) {
  return useResourceCache<T>({
    resourceType,
    ttl,
    enableAutoCleanup: true
  });
}

/**
 * Hook for monitoring cache performance across all resource types
 */
export function useCacheMonitoring() {
  const [metrics, setMetrics] = React.useState<StorageMetrics>(() => 
    cacheService.getMetrics()
  );

  React.useEffect(() => {
    const updateMetrics = () => {
      setMetrics(cacheService.getMetrics());
    };

    // Update immediately
    updateMetrics();

    // Set up periodic updates
    const interval = setInterval(updateMetrics, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const performGlobalCleanup = React.useCallback(async () => {
    const deletedCount = cacheService.cleanup();
    setMetrics(cacheService.getMetrics());
    return deletedCount;
  }, []);

  const clearAllCache = React.useCallback(() => {
    const success = cacheService.clear();
    setMetrics(cacheService.getMetrics());
    return success;
  }, []);

  return {
    metrics,
    cleanup: performGlobalCleanup,
    clear: clearAllCache,
    refresh: () => setMetrics(cacheService.getMetrics())
  };
}
