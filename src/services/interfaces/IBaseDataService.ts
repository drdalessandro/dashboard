// src/services/interfaces/IBaseDataService.ts
import { BaseResource, ListResponse, PaginationParams, FilterParams, SortParams, CacheConfig } from '../models';

/**
 * Base interface for data services that manage FHIR resources
 */
export interface IBaseDataService<T extends BaseResource> {
    /**
     * Get a list of resources with optional filtering, pagination, and sorting
     */
    getList(
        filters?: FilterParams,
        pagination?: PaginationParams,
        sort?: SortParams,
        cacheConfig?: CacheConfig
    ): Promise<ListResponse<T>>;

    /**
     * Get a single resource by ID
     */
    getOne(
        id: string,
        cacheConfig?: CacheConfig
    ): Promise<T>;

    /**
     * Create a new resource
     */
    create(
        data: Partial<T>
    ): Promise<T>;

    /**
     * Update an existing resource
     */
    update(
        id: string,
        data: Partial<T>
    ): Promise<T>;

    /**
     * Delete a resource
     */
    delete(
        id: string
    ): Promise<void>;

    /**
     * Sync pending offline changes
     */
    syncPendingChanges(): Promise<void>;

    /**
     * Clear the cache for this resource type
     */
    clearCache(): Promise<void>;
}

/**
 * Base configuration for data services
 */
export interface DataServiceConfig {
    resourceType: string;
    basePath?: string;
    cacheConfig?: CacheConfig;
}