// src/data/services/StorageService.ts
// IndexedDB wrapper for efficient offline storage

import { openDB, IDBPDatabase, DBSchema } from 'idb';
import { BaseResource, CacheConfig, DEFAULT_CACHE_CONFIG, SyncStatus } from '../models/base';

// Define a type for the valid store names
type ValidStoreName = 'patients' | 'observations' | 'medicationRequests' | 'practitioners' | 'appointments' | 'metadata';

/**
 * Schema for the application's IndexedDB
 */
interface GandallDBSchema extends DBSchema {
  // Resource collections (one store per resource type)
  patients: {
    key: string;
    value: BaseResource;
    indexes: {
      'by-update': string;
    };
  };
  observations: {
    key: string;
    value: BaseResource;
    indexes: {
      'by-update': string;
      'by-patient': string;
    };
  };
  medicationRequests: {
    key: string;
    value: BaseResource;
    indexes: {
      'by-update': string;
      'by-patient': string;
    };
  };
  practitioners: {
    key: string;
    value: BaseResource;
    indexes: {
      'by-update': string;
    };
  };
  appointments: {
    key: string;
    value: BaseResource;
    indexes: {
      'by-update': string;
      'by-patient': string;
      'by-practitioner': string;
    };
  };
  // Metadata store for caching information
  metadata: {
    key: string;
    value: {
      lastUpdated: string;
      expiresAt: string;
      query?: string;
      count?: number;
    };
  };
}

// Database version - increment when schema changes
const DB_VERSION = 1;
// Database name
const DB_NAME = 'gandall-healthcare-db';

/**
 * StorageService provides a centralized interface for offline data storage
 * using IndexedDB with type safety and optimized for healthcare data.
 */
export class StorageService {
  private db: IDBPDatabase<GandallDBSchema> | null = null;
  private dbPromise: Promise<IDBPDatabase<GandallDBSchema>> | null = null;

  /**
   * Initialize the database connection
   */
  public async initialize(): Promise<IDBPDatabase<GandallDBSchema>> {
    if (this.db) return this.db;

    if (!this.dbPromise) {
      this.dbPromise = openDB<GandallDBSchema>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // Create stores for each resource type
          if (!db.objectStoreNames.contains('patients')) {
            const patientsStore = db.createObjectStore('patients', { keyPath: 'id' });
            patientsStore.createIndex('by-update', 'meta.lastUpdated');
          }

          if (!db.objectStoreNames.contains('observations')) {
            const observationsStore = db.createObjectStore('observations', { keyPath: 'id' });
            observationsStore.createIndex('by-update', 'meta.lastUpdated');
            observationsStore.createIndex('by-patient', 'subject.reference');
          }

          if (!db.objectStoreNames.contains('medicationRequests')) {
            const medicationRequestsStore = db.createObjectStore('medicationRequests', { keyPath: 'id' });
            medicationRequestsStore.createIndex('by-update', 'meta.lastUpdated');
            medicationRequestsStore.createIndex('by-patient', 'subject.reference');
          }

          if (!db.objectStoreNames.contains('practitioners')) {
            const practitionersStore = db.createObjectStore('practitioners', { keyPath: 'id' });
            practitionersStore.createIndex('by-update', 'meta.lastUpdated');
          }

          if (!db.objectStoreNames.contains('appointments')) {
            const appointmentsStore = db.createObjectStore('appointments', { keyPath: 'id' });
            appointmentsStore.createIndex('by-update', 'meta.lastUpdated');
            appointmentsStore.createIndex('by-patient', 'participant.reference');
            appointmentsStore.createIndex('by-practitioner', 'participant.reference');
          }

          // Create metadata store
          if (!db.objectStoreNames.contains('metadata')) {
            db.createObjectStore('metadata', { keyPath: 'key' });
          }
        }
      });
    }

    this.db = await this.dbPromise;
    return this.db;
  }

  /**
   * Close the database connection
   */
  public async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.dbPromise = null;
    }
  }

  /**
   * Get a resource by ID
   */
  public async getResource<T extends BaseResource>(
    storeName: ValidStoreName,
    id: string
  ): Promise<T | null> {
    const db = await this.initialize();
    return db.get(storeName, id) as Promise<T | null>;
  }

  /**
   * Save a resource
   */
  public async saveResource<T extends BaseResource>(
    storeName: ValidStoreName,
    resource: T
  ): Promise<string> {
    const db = await this.initialize();

    // Ensure resource has an ID
    if (!resource.id) {
      throw new Error(`Cannot save resource without an ID`);
    }

    // Update timestamp if not provided
    if (!resource._localMeta) {
      resource._localMeta = {
        syncStatus: SyncStatus.SYNCED,
        lastSynced: new Date().toISOString()
      };
    }

    await db.put(storeName, resource);
    return resource.id;
  }

  /**
   * Delete a resource
   */
  public async deleteResource(
    storeName: ValidStoreName,
    id: string
  ): Promise<void> {
    const db = await this.initialize();
    await db.delete(storeName, id);
  }

  /**
   * Get all resources of a type
   */
  public async getAllResources<T extends BaseResource>(
    storeName: ValidStoreName
  ): Promise<T[]> {
    const db = await this.initialize();
    return db.getAll(storeName) as Promise<T[]>;
  }

  /**
   * Query resources with filtering
   */
  public async queryResources<T extends BaseResource>(
    storeName: ValidStoreName,
    query: {
      indexName?: string;
      indexValue?: IDBKeyRange | string;
      limit?: number;
      offset?: number;
    }
  ): Promise<T[]> {
    const db = await this.initialize();

    if (query.indexName) {
      // Query using an index
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);

      // Type assertion for IDBObjectStore.index method - this tells TypeScript
      // that we're accessing a valid index name even though we can't verify it statically
      const storeAny = store as any;
      const index = storeAny.index(query.indexName);

      let result: Promise<T[]>;
      if (query.indexValue) {
        // Handle string or IDBKeyRange properly
        const keyRange = typeof query.indexValue === 'string' ? IDBKeyRange.only(query.indexValue) : query.indexValue;
        result = index.getAll(keyRange, query.limit) as Promise<T[]>;
      } else {
        result = index.getAll(undefined, query.limit) as Promise<T[]>;
      }
      await tx.done;
      return result;
    } else {
      // Get all with optional limit
      return db.getAll(storeName, undefined, query.limit) as Promise<T[]>;
    }
  }

  /**
   * Count resources
   */
  public async countResources(
    storeName: ValidStoreName,
    query?: {
      indexName?: string;
      indexValue?: IDBKeyRange | string;
    }
  ): Promise<number> {
    const db = await this.initialize();

    if (query?.indexName) {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);

      // Type assertion for IDBObjectStore.index method - this tells TypeScript
      // that we're accessing a valid index name even though we can't verify it statically
      const storeAny = store as any;
      const index = storeAny.index(query.indexName);

      let result: Promise<number>;
      if (query.indexValue) {
        // Handle string or IDBKeyRange properly
        const keyRange = typeof query.indexValue === 'string' ? IDBKeyRange.only(query.indexValue) : query.indexValue;
        result = index.count(keyRange);
      } else {
        result = index.count();
      }
      await tx.done;
      return result;
    } else {
      // Create a transaction for consistent typing
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const result = store.count();
      await tx.done;
      return result;
    }
  }

  /**
   * Save metadata for a query
   */
  public async saveMetadata(
    key: string,
    data: {
      lastUpdated: string;
      expiresAt: string;
      query?: string;
      count?: number;
    }
  ): Promise<void> {
    const db = await this.initialize();
    // For metadata store, we need to provide the key as a separate parameter
    // since it's defined as the keyPath in the schema
    await db.put('metadata', data, key);
  }

  /**
   * Get metadata for a query
   */
  public async getMetadata(key: string): Promise<{
    lastUpdated: string;
    expiresAt: string;
    query?: string;
    count?: number;
  } | null> {
    const db = await this.initialize();
    const result = await db.get('metadata', key);
    // Convert undefined to null to match the return type
    return result || null;
  }

  /**
   * Check if data is stale based on cache config
   */
  public isDataStale(
    lastUpdated: string | null,
    config: CacheConfig = DEFAULT_CACHE_CONFIG
  ): boolean {
    if (!lastUpdated) return true;

    const now = new Date();
    const updateTime = new Date(lastUpdated);
    const maxAge = config.maxAge || DEFAULT_CACHE_CONFIG.maxAge;

    // Calculate expiration time
    const expirationTime = new Date(updateTime.getTime() + maxAge!);

    return now > expirationTime;
  }

  /**
   * Clear all data for a resource type
   */
  public async clearStore(storeName: ValidStoreName): Promise<void> {
    const db = await this.initialize();
    const tx = db.transaction(storeName, 'readwrite');
    await tx.objectStore(storeName).clear();
    await tx.done;
  }

  /**
   * Clear all cached data
   */
  public async clearAllStores(): Promise<void> {
    const db = await this.initialize();
    // Use Array.from to convert DOMStringList to an iterable array
    const storeNames = Array.from(db.objectStoreNames);

    for (const storeName of storeNames) {
      const storeNameTyped = storeName as ValidStoreName;
      const tx = db.transaction(storeNameTyped, 'readwrite');
      await tx.objectStore(storeNameTyped).clear();
      await tx.done;
    }
  }

  /**
   * Get the database size estimation
   */
  public async getDatabaseSize(): Promise<number> {
    // Note: This is an estimation, as precise size calculation
    // requires iterating through all records
    const db = await this.initialize();
    let totalSize = 0;

    // Use Array.from to convert DOMStringList to an iterable array
    for (const storeName of Array.from(db.objectStoreNames)) {
      const storeNameTyped = storeName as ValidStoreName;
      const tx = db.transaction(storeNameTyped, 'readonly');
      const store = tx.objectStore(storeNameTyped);
      const allRecords = await store.getAll();

      const storeSize = allRecords.reduce((size, record) => {
        // Estimate size by converting to JSON string
        return size + JSON.stringify(record).length;
      }, 0);

      totalSize += storeSize;
      await tx.done;
    }

    return totalSize;
  }
}

// Create a singleton instance
export const storageService = new StorageService();

export default storageService;
