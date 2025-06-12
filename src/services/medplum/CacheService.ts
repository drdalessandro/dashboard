/**
 * CacheService.ts
 * 
 * Abstracts localStorage operations for FHIR resources and application data
 * Provides type-safe storage, cache management, and automatic cleanup
 * Extracted from useMedplum to improve separation of concerns
 */

import { Resource, ResourceType } from '@medplum/fhirtypes';
import { createLogger } from '../../utils/logger';
import React from 'react';

// Initialize logger for this service
const logger = createLogger('CacheService');

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
  version?: string;
}

export interface CacheOptions {
  ttl?: number; // Default TTL in milliseconds
  maxSize?: number; // Maximum number of entries
  prefix?: string; // Key prefix for namespacing
}

export interface StorageMetrics {
  totalEntries: number;
  totalSize: number; // Approximate size in bytes
  oldestEntry: number; // Timestamp
  newestEntry: number; // Timestamp
}

/**
 * Service for managing localStorage operations with caching strategies
 */
export class CacheService {
  private readonly prefix: string;
  private readonly defaultTTL: number;
  private readonly maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.prefix = options.prefix || 'medplum';
    this.defaultTTL = options.ttl || 24 * 60 * 60 * 1000; // 24 hours default
    this.maxSize = options.maxSize || 1000; // 1000 entries max
  }

  /**
   * Store data in cache with optional TTL
   */
  public set<T>(key: string, data: T, ttl?: number): boolean {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttl || this.defaultTTL,
        version: '1.0'
      };

      const fullKey = this.getFullKey(key);
      const serialized = JSON.stringify(entry);

      localStorage.setItem(fullKey, serialized);

      logger.debug(`Cached data for key: ${key}`, {
        size: serialized.length,
        ttl: entry.ttl
      });

      // Perform cleanup if needed
      this.cleanupIfNeeded();

      return true;
    } catch (error) {
      logger.error(`Failed to cache data for key: ${key}`, error);
      return false;
    }
  }

  /**
   * Retrieve data from cache
   */
  public get<T>(key: string): T | null {
    try {
      const fullKey = this.getFullKey(key);
      const serialized = localStorage.getItem(fullKey);

      if (!serialized) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(serialized);

      // Check if entry has expired
      if (this.isExpired(entry)) {
        logger.debug(`Cache entry expired for key: ${key}`);
        this.delete(key);
        return null;
      }

      logger.debug(`Cache hit for key: ${key}`, {
        age: Date.now() - entry.timestamp
      });

      return entry.data;
    } catch (error) {
      logger.error(`Failed to retrieve cached data for key: ${key}`, error);
      return null;
    }
  }

  /**
   * Delete specific cache entry
   */
  public delete(key: string): boolean {
    try {
      const fullKey = this.getFullKey(key);
      localStorage.removeItem(fullKey);
      logger.debug(`Deleted cache entry for key: ${key}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete cache entry for key: ${key}`, error);
      return false;
    }
  }

  /**
   * Check if key exists in cache and is not expired
   */
  public has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clear all cache entries with the service prefix
   */
  public clear(): boolean {
    try {
      const keys = this.getAllKeys();
      let deletedCount = 0;

      for (const key of keys) {
        localStorage.removeItem(key);
        deletedCount++;
      }

      logger.info(`Cleared ${deletedCount} cache entries`);
      return true;
    } catch (error) {
      logger.error('Failed to clear cache:', error);
      return false;
    }
  }

  /**
   * Get storage metrics
   */
  public getMetrics(): StorageMetrics {
    const keys = this.getAllKeys();
    let totalSize = 0;
    let oldestEntry = Date.now();
    let newestEntry = 0;

    for (const key of keys) {
      try {
        const serialized = localStorage.getItem(key);
        if (serialized) {
          totalSize += serialized.length;

          const entry: CacheEntry = JSON.parse(serialized);
          if (entry.timestamp < oldestEntry) {
            oldestEntry = entry.timestamp;
          }
          if (entry.timestamp > newestEntry) {
            newestEntry = entry.timestamp;
          }
        }
      } catch (error) {
        logger.warn(`Failed to parse cache entry: ${key}`, error);
      }
    }

    return {
      totalEntries: keys.length,
      totalSize,
      oldestEntry,
      newestEntry
    };
  }

  /**
   * Cache a FHIR resource
   */
  public cacheResource(resource: Resource): boolean {
    if (!resource.resourceType || !resource.id) {
      logger.warn('Cannot cache resource without resourceType or id', resource);
      return false;
    }

    const key = `${resource.resourceType}.${resource.id}`;
    return this.set(key, resource);
  }

  /**
   * Retrieve a cached FHIR resource
   */
  public getCachedResource<T extends Resource>(
    resourceType: ResourceType,
    id: string
  ): T | null {
    const key = `${resourceType}.${id}`;
    return this.get<T>(key);
  }

  /**
   * Cache a list of FHIR resources
   */
  public cacheResourceList<T extends Resource>(
    resourceType: ResourceType,
    resources: T[],
    queryKey?: string
  ): boolean {
    try {
      // Cache individual resources
      for (const resource of resources) {
        this.cacheResource(resource);
      }

      // Cache the list itself if queryKey provided
      if (queryKey) {
        const listKey = `${resourceType}.list.${queryKey}`;
        this.set(listKey, resources, this.defaultTTL / 2); // Shorter TTL for lists
      }

      return true;
    } catch (error) {
      logger.error(`Failed to cache resource list for ${resourceType}:`, error);
      return false;
    }
  }

  /**
   * Get cached resource list
   */
  public getCachedResourceList<T extends Resource>(
    resourceType: ResourceType,
    queryKey: string
  ): T[] | null {
    const listKey = `${resourceType}.list.${queryKey}`;
    return this.get<T[]>(listKey);
  }

  /**
   * Invalidate all cached resources of a specific type
   */
  public invalidateResourceType(resourceType: ResourceType): number {
    const keys = this.getAllKeys();
    const pattern = this.getFullKey(`${resourceType}.`);
    let deletedCount = 0;

    for (const key of keys) {
      if (key.startsWith(pattern)) {
        localStorage.removeItem(key);
        deletedCount++;
      }
    }

    logger.info(`Invalidated ${deletedCount} cache entries for ${resourceType}`);
    return deletedCount;
  }

  /**
   * Cleanup expired entries and enforce size limits
   */
  public cleanup(): number {
    const keys = this.getAllKeys();
    let deletedCount = 0;

    // Remove expired entries
    for (const key of keys) {
      try {
        const serialized = localStorage.getItem(key);
        if (serialized) {
          const entry: CacheEntry = JSON.parse(serialized);
          if (this.isExpired(entry)) {
            localStorage.removeItem(key);
            deletedCount++;
          }
        }
      } catch (error) {
        // Remove corrupted entries
        localStorage.removeItem(key);
        deletedCount++;
      }
    }

    // Enforce size limits by removing oldest entries
    const remainingKeys = this.getAllKeys();
    if (remainingKeys.length > this.maxSize) {
      const entriesToRemove = remainingKeys.length - this.maxSize;
      const entries: Array<{ key: string; timestamp: number }> = [];

      for (const key of remainingKeys) {
        try {
          const serialized = localStorage.getItem(key);
          if (serialized) {
            const entry: CacheEntry = JSON.parse(serialized);
            entries.push({ key, timestamp: entry.timestamp });
          }
        } catch (error) {
          // Remove corrupted entry
          localStorage.removeItem(key);
          deletedCount++;
        }
      }

      // Sort by timestamp (oldest first) and remove excess
      entries.sort((a, b) => a.timestamp - b.timestamp);
      for (let i = 0; i < entriesToRemove; i++) {
        localStorage.removeItem(entries[i].key);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      logger.info(`Cleaned up ${deletedCount} cache entries`);
    }

    return deletedCount;
  }

  /**
   * Get full key with prefix
   */
  private getFullKey(key: string): string {
    return `${this.prefix}.${key}`;
  }

  /**
   * Check if code is running in browser environment
   */
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  /**
   * Get all keys with the service prefix
   */
  private getAllKeys(): string[] {
    if (!this.isBrowser()) {
      return [];
    }

    const keys: string[] = [];
    const prefix = `${this.prefix}.`;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keys.push(key);
        }
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    }

    return keys;
  }

  /**
   * Check if cache entry has expired
   */
  private isExpired(entry: CacheEntry): boolean {
    if (!entry.ttl) return false;
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Perform cleanup if storage is getting full
   */
  private cleanupIfNeeded(): void {
    const keys = this.getAllKeys();

    // Cleanup if we have too many entries
    if (keys.length > this.maxSize * 0.8) {
      logger.debug('Triggering cache cleanup due to size threshold');
      this.cleanup();
    }
  }
}

// Singleton instance for use throughout the application
export const cacheService = new CacheService({
  prefix: 'medplum',
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  maxSize: 1000
});

/**
 * React hook to use cache service with automatic cleanup
 */
export function useCache() {
  React.useEffect(() => {
    // Perform cleanup on mount
    const cleanedUp = cacheService.cleanup();
    if (cleanedUp > 0) {
      logger.info(`Initial cache cleanup removed ${cleanedUp} entries`);
    }

    // Set up periodic cleanup
    const cleanupInterval = setInterval(() => {
      cacheService.cleanup();
    }, 60 * 60 * 1000); // Every hour

    return () => {
      clearInterval(cleanupInterval);
    };
  }, []);

  return {
    cache: cacheService,
    metrics: cacheService.getMetrics(),
  };
}
