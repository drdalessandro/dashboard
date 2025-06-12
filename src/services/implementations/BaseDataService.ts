// src/services/implementations/BaseDataService.ts
import { BaseResource, ListResponse, PaginationParams, FilterParams, SortParams, CacheConfig, SyncStatus, DEFAULT_CACHE_CONFIG } from '../models';
import { DataServiceConfig, IBaseDataService } from '../interfaces/IBaseDataService';
import { medplumClient } from '../../lib/medplum/client';
import { parseSearchParams } from '@utils/parseSearchParams';

/**
 * Base logger factory
 */
export const createLogger = (name: string) => ({
    debug: (message: string, ...args: any[]) => console.debug(`[${name}] ${message}`, ...args),
    info: (message: string, ...args: any[]) => console.info(`[${name}] ${message}`, ...args),
    warn: (message: string, ...args: any[]) => console.warn(`[${name}] ${message}`, ...args),
    error: (message: string, ...args: any[]) => console.error(`[${name}] ${message}`, ...args),
});

/**
 * Base implementation for all data services
 * Contains common functionality for FHIR resource operations
 */
export abstract class BaseDataService<T extends BaseResource> implements IBaseDataService<T> {
    protected resourceType: string;
    protected basePath: string;
    protected defaultCacheConfig: CacheConfig;
    protected logger: ReturnType<typeof createLogger>;

    constructor(config?: Partial<DataServiceConfig>) {
        this.resourceType = config?.resourceType || this.getDefaultResourceType();
        this.basePath = config?.basePath || '';
        this.defaultCacheConfig = config?.cacheConfig || DEFAULT_CACHE_CONFIG;
        this.logger = createLogger(this.constructor.name);
    }

    /**
     * Abstract method to get the default resource type for this service
     * Must be implemented by derived classes
     */
    protected abstract getDefaultResourceType(): string;

    /**
     * Get a cached item from storage
     */
    protected getCachedItem<R>(key: string): R | null {
        try {
            const item = localStorage.getItem(key);
            if (!item) return null;

            const parsed = JSON.parse(item);

            // Check if the cache is expired
            if (parsed._cachedAt && this.defaultCacheConfig.maxAge) {
                const now = new Date().getTime();
                const cachedAt = new Date(parsed._cachedAt).getTime();
                if (now - cachedAt > this.defaultCacheConfig.maxAge) {
                    // Cache is stale
                    if (!this.defaultCacheConfig.staleWhileRevalidate) {
                        return null; // Don't use stale data
                    }
                    // Mark as stale for staleWhileRevalidate
                    parsed._isStale = true;
                }
            }

            return parsed as R;
        } catch (error) {
            this.logger.error(`Error retrieving cached item ${key}:`, error);
            return null;
        }
    }

    /**
     * Set a cached item in storage
     */
    protected setCachedItem<R>(key: string, data: R): void {
        try {
            // Add cache timestamp
            const dataWithMeta = {
                ...data,
                _cachedAt: new Date().toISOString()
            };
            localStorage.setItem(key, JSON.stringify(dataWithMeta));
        } catch (error) {
            this.logger.error(`Error caching item ${key}:`, error);
        }
    }

    /**
     * Generate a cache key for a resource
     */
    protected getCacheKey(id?: string, params?: Record<string, any>): string {
        let key = `fhir_${this.resourceType}`;
        if (id) key += `_${id}`;
        if (params) {
            // Sort keys to ensure consistent cache keys
            const sortedParams = Object.keys(params)
                .filter(k => params[k] !== undefined)
                .sort()
                .reduce((obj, key) => {
                    obj[key] = params[key];
                    return obj;
                }, {} as Record<string, any>);

            key += `_${JSON.stringify(sortedParams)}`;
        }
        return key;
    }

    /**
     * Make a request to the FHIR server with offline fallback
     */
    protected async makeRequest<R>(
        path: string,
        method: string,
        body?: any,
        cacheConfig?: CacheConfig
    ): Promise<R> {
        const config = { ...this.defaultCacheConfig, ...cacheConfig };
        const cacheKey = this.getCacheKey(path, method === 'GET' ? body : undefined);

        // Try to get from cache first if it's a GET request
        if (method === 'GET' && !config.forceRefresh) {
            const cachedData = this.getCachedItem<R>(cacheKey);
            if (cachedData) {
                // If we have cached data, use it

                // If online and data is stale, revalidate in background
                if (navigator.onLine && (cachedData as any)._isStale) {
                    this.fetchAndUpdateCache<R>(path, method, body, cacheKey)
                        .catch(error => this.logger.error('Background refresh failed:', error));
                }

                // Return cached data (removing internal cache metadata)
                const { _cachedAt, _isStale, ...cleanData } = cachedData as any;
                return cleanData as R;
            }
        }

        // If we're offline and it's not a GET request, queue the change
        if (!navigator.onLine && method !== 'GET') {
            return this.queueOfflineChange<R>(path, method, body);
        }

        // Make the actual request
        return this.fetchAndUpdateCache<R>(path, method, body, cacheKey);
    }

    /**
     * Fetch data from server using MedplumClient and update cache
     */
    protected async fetchAndUpdateCache<R>(
        path: string,
        method: string,
        body?: any,
        cacheKey?: string
    ): Promise<R> {
        try {
            let result: R;

            // Use the appropriate medplum method based on the HTTP method
            switch (method) {
                case 'GET':
                    // For GET, use different methods based on path structure
                    if (path.includes('/')) {
                        // For specific resource search endpoints
                        const [resourceTypePath, searchParams] = path.split('/');

                        // Ensure resourceTypePath is a valid ResourceType
                        if (!resourceTypePath || typeof resourceTypePath !== 'string') {
                            throw new Error(`Invalid resource type path: ${resourceTypePath}`);
                        }
                        // Parse search parameters safely
                        let searchParamsObj = {};
                        try {
                            if (searchParams) {
                                searchParamsObj = JSON.parse(searchParams || '{}');
                            } else if (body) {
                                // parse body array and get construct searchParams
                                searchParamsObj = parseSearchParams(body);
                            }
                        } catch (e: unknown) {
                            const errorMessage = e instanceof Error ? e.message : 'Unknown error';
                            throw new Error(`Invalid search parameters: ${errorMessage}`);
                        }

                        // Use MedplumClient.search directly
                        result = await medplumClient.search(resourceTypePath as any, searchParamsObj) as R;
                    } else {
                        // For single resource fetch
                        // path in this context should be the resource ID
                        result = await medplumClient.readResource(this.resourceType as any, path) as R;
                    }
                    break;
                case 'POST':
                    // Ensure body has the correct resourceType
                    if (typeof body === 'string') {
                        try {
                            body = JSON.parse(body);
                        } catch (e: unknown) {
                            const errorMessage = e instanceof Error ? e.message : 'Unknown error';
                            throw new Error(`Invalid JSON in request body: ${errorMessage}`);
                        }
                    }

                    const createBody = {
                        ...(body as object || {}),
                        resourceType: this.resourceType
                    };

                    result = await medplumClient.createResource(createBody as any) as R;
                    break;
                case 'PUT':
                    // For update operations, ensure the body has the correct format
                    if (typeof body === 'string') {
                        try {
                            body = JSON.parse(body);
                        } catch (e: unknown) {
                            const errorMessage = e instanceof Error ? e.message : 'Unknown error';
                            throw new Error(`Invalid JSON in request body: ${errorMessage}`);
                        }
                    }

                    // For updates to FHIR resources, ensure all required fields are present
                    const updateBody = {
                        ...(body as object || {}),
                        resourceType: this.resourceType,
                        // For updates, we need the ID from the path if not already included
                        id: (body as any)?.id || path
                    };

                    result = await medplumClient.updateResource(updateBody as any) as R;
                    break;
                case 'DELETE':
                    // path in this context should be the resource ID
                    await medplumClient.deleteResource(this.resourceType as any, path);
                    result = {} as R;
                    break;
                default:
                    throw new Error(`Unsupported method: ${method}`);
            }

            // Cache GET results
            if (method === 'GET' && cacheKey && this.defaultCacheConfig.persistToStorage) {
                this.setCachedItem(cacheKey, result);
            }

            return result;
        } catch (error) {
            this.logger.error(`Request failed for ${path}:`, error);

            // For GET requests, try to fall back to cache even if we didn't use it earlier
            if (method === 'GET' && cacheKey) {
                const cachedData = this.getCachedItem<R>(cacheKey);
                if (cachedData) {
                    this.logger.debug(`Using cached data after failed request for ${path}`);
                    const { _cachedAt, _isStale, ...cleanData } = cachedData as any;
                    return cleanData as R;
                }
            }

            throw error;
        }
    }

    /**
     * Queue a change for when we're online again
     */
    protected async queueOfflineChange<R>(path: string, method: string, body?: any): Promise<R> {
        // Create a unique ID for this operation
        const operationId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Get existing queue
        const queueKey = `offline_queue_${this.resourceType}`;
        const existingQueueStr = localStorage.getItem(queueKey) || '[]';
        const existingQueue = JSON.parse(existingQueueStr);

        // Add this operation to the queue
        const operation = {
            id: operationId,
            resourceType: this.resourceType as string,
            path,
            method,
            body,
            timestamp: new Date().toISOString()
        };

        existingQueue.push(operation);
        localStorage.setItem(queueKey, JSON.stringify(existingQueue));

        // For optimistic updates, update the cache as if the operation succeeded
        if ((method === 'POST' || method === 'PUT') && body) {
            // Optimistically update the cache for creates and updates
            const resourceId = body.id || `temp_${operationId}`;
            const cacheKey = this.getCacheKey(resourceId);

            let updatedData: any;

            if (method === 'POST') {
                // For creates, add a temporary ID
                updatedData = {
                    ...body,
                    id: resourceId,
                    _localMeta: {
                        syncStatus: 'PENDING' as SyncStatus,
                        pendingOperations: [operationId]
                    }
                };
            } else if (method === 'PUT') {
                // For updates, get the existing data and merge
                const existingData = this.getCachedItem(cacheKey) || {};
                updatedData = {
                    ...existingData,
                    ...body,
                    _localMeta: {
                        syncStatus: 'PENDING' as SyncStatus,
                        pendingOperations: [
                            ...((existingData as any)._localMeta?.pendingOperations || []),
                            operationId
                        ]
                    }
                };
            }

            if (updatedData) {
                this.setCachedItem(cacheKey, updatedData);
            }

            return updatedData as R;
        } else if (method === 'DELETE') {
            // For deletes, mark the object as pending deletion
            const cacheKey = this.getCacheKey(path);
            const existingData = this.getCachedItem(cacheKey);

            if (existingData) {
                const updatedData = {
                    ...existingData,
                    _localMeta: {
                        syncStatus: 'PENDING' as SyncStatus,
                        pendingOperations: [
                            ...((existingData as any)._localMeta?.pendingOperations || []),
                            operationId
                        ],
                        isDeleted: true
                    }
                };

                this.setCachedItem(cacheKey, updatedData);
            }
        }

        // Return a mock response
        return {
            id: body?.id || `temp_${operationId}`,
            _localMeta: {
                syncStatus: 'PENDING' as SyncStatus,
                pendingOperations: [operationId]
            }
        } as unknown as R;
    }

    // IBaseDataService implementation methods

    /**
     * Implementation of getList
     */
    async getList(
        filters?: FilterParams,
        pagination?: PaginationParams,
        sort?: SortParams,
        cacheConfig?: CacheConfig
    ): Promise<ListResponse<T>> {
        // Construct search params
        const searchParams: Record<string, any> = { ...filters };

        // Handle pagination
        if (pagination) {
            if (pagination.page && pagination.pageSize) {
                searchParams._count = pagination.pageSize;
                searchParams._offset = (pagination.page - 1) * pagination.pageSize;
            }
        }

        // Handle sorting
        if (sort) {
            searchParams._sort = sort.order === 'desc' ? `-${sort.field}` : sort.field;
        }

        // Make the request
        const result = await this.makeRequest<any>(
            `${this.resourceType}/`,
            'GET',
            searchParams,
            cacheConfig
        );

        // Process the result - get entries with improved handling of different response formats
        const data = this.extractResourcesFromResponse(result);
        const total = data.length;

        // Return formatted response
        return {
            data: data as T[],
            pagination: {
                page: pagination?.page || 1,
                pageSize: pagination?.pageSize || data.length,
                totalCount: total
            },
            meta: {
                syncStatus: navigator.onLine ? SyncStatus.SYNCED : SyncStatus.OFFLINE,
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * Extract resources from various FHIR response formats
     */
    protected extractResourcesFromResponse(result: any): BaseResource[] {
        // Case 1: Handle FHIR Bundle
        if (result.resourceType === 'Bundle' && Array.isArray(result.entry)) {
            return result.entry.map((entry: any) => entry.resource);
        }

        // Case 2: Handle array directly in entry property
        else if (Array.isArray(result.entry)) {
            return result.entry;
        }

        // Case 3: Handle object with numeric keys
        else if (typeof result === 'object' && result !== null && !Array.isArray(result)) {
            // Check if the object has keys that are numeric strings ("0", "1", etc.)
            const values = Object.values(result);
            if (values.length > 0 && values.every(value =>
                typeof value === 'object' &&
                value !== null &&
                'resourceType' in value
            )) {
                return values as BaseResource[];
            }
        }

        // Case 4: Handle direct array
        else if (Array.isArray(result)) {
            return result;
        }

        // Default: return empty array if no recognized format
        return [];
    }

    /**
     * Implementation of getOne
     */
    async getOne(id: string, cacheConfig?: CacheConfig): Promise<T> {
        return this.makeRequest<T>(id, 'GET', undefined, cacheConfig);
    }

    /**
     * Implementation of create
     */
    async create(data: Partial<T>): Promise<T> {
        return this.makeRequest<T>('', 'POST', data);
    }

    /**
     * Implementation of update
     */
    async update(id: string, data: Partial<T>): Promise<T> {
        // Ensure the resource has the correct ID and type
        const updateData = {
            ...data,
            id,
            resourceType: this.resourceType
        };

        return this.makeRequest<T>(id, 'PUT', updateData);
    }

    /**
     * Implementation of delete
     */
    async delete(id: string): Promise<void> {
        await this.makeRequest<void>(id, 'DELETE');
    }

    /**
     * Implementation of syncPendingChanges
     */
    async syncPendingChanges(): Promise<void> {
        if (!navigator.onLine) {
            this.logger.warn('Cannot sync changes while offline');
            return;
        }

        const queueKey = `offline_queue_${this.resourceType}`;
        const queueStr = localStorage.getItem(queueKey);

        if (!queueStr) return; // No pending changes

        const queue = JSON.parse(queueStr);
        if (!queue.length) return; // Empty queue

        this.logger.info(`Syncing ${queue.length} pending changes for ${this.resourceType}`);

        // Process each queued operation
        const newQueue = [...queue]; // Create a copy to modify

        for (let i = 0; i < queue.length; i++) {
            const operation = queue[i];

            try {
                // Process this operation
                await this.fetchAndUpdateCache(
                    operation.path,
                    operation.method,
                    operation.body
                );

                // Remove from queue on success
                const index = newQueue.findIndex(op => op.id === operation.id);
                if (index !== -1) {
                    newQueue.splice(index, 1);
                }

                // Update the queue in localStorage
                localStorage.setItem(queueKey, JSON.stringify(newQueue));
            } catch (error) {
                this.logger.error(`Failed to sync operation ${operation.id}:`, error);
                // Continue with next operation
            }
        }

        // If all operations were processed, clear the queue
        if (newQueue.length === 0) {
            localStorage.removeItem(queueKey);
        }
    }

    /**
     * Implementation of clearCache
     */
    async clearCache(): Promise<void> {
        // Get all keys in localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);

            // Delete keys related to this resource type
            if (key && key.startsWith(`fhir_${this.resourceType}`)) {
                localStorage.removeItem(key);
            }
        }
    }
}