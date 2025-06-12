// src/services/models.ts
// Base models for all data services

/**
 * Base resource type for all FHIR resources
 */
export interface BaseResource {
    id?: string;
    resourceType: string;
    meta?: {
        versionId?: string;
        lastUpdated?: string;
    };
}

/**
 * Status of data synchronization
 */
export enum SyncStatus {
    SYNCED = 'SYNCED',
    SYNCING = 'SYNCING',
    PENDING = 'PENDING',
    FAILED = 'FAILED',
    OFFLINE = 'OFFLINE'
}

/**
 * Configuration for caching behavior
 */
export interface CacheConfig {
    /**
     * Maximum age (in ms) before cache is considered stale
     */
    maxAge?: number;

    /**
     * Whether to serve stale data while fetching fresh data
     */
    staleWhileRevalidate?: boolean;

    /**
     * Whether to force a refresh from the server
     */
    forceRefresh?: boolean;

    /**
     * Whether to persist data to storage (e.g. localStorage)
     */
    persistToStorage?: boolean;
}

/**
 * Default cache configuration
 */
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
    maxAge: 5 * 60 * 1000, // 5 minutes
    staleWhileRevalidate: true,
    forceRefresh: false,
    persistToStorage: true
};

/**
 * Parameters for pagination
 */
export interface PaginationParams {
    page?: number;
    pageSize?: number;
}

/**
 * Parameters for filtering
 */
export type FilterParams = Record<string, any>;

/**
 * Parameters for sorting
 */
export interface SortParams {
    field: string;
    order: 'asc' | 'desc';
}

/**
 * Standard response for list operations
 */
export interface ListResponse<T> {
    data: T[];
    pagination: {
        page: number;
        pageSize: number;
        totalCount: number;
    };
    meta: {
        syncStatus: SyncStatus;
        timestamp: string;
    };
}