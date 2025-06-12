/**
 * createResourceHook.ts
 * 
 * Main factory function for generating resource-specific hooks
 * Combines base hooks, services, configurations, and enhancement strategies
 * to create fully-featured FHIR resource hooks with minimal configuration
 */

import React from 'react';
import { Resource, ResourceType } from '@medplum/fhirtypes';
import {
    useBaseCRUD,
    useResourceCache,
    useResourceEnhancement,
    useBaseState,
    type BaseCRUDOptions,
    type ResourceCacheOptions,
    type ResourceEnhancementOptions,
    type BaseStateOptions,
    type EnhancedResource,
    type PaginationState,
    type FilterState,
    type LoadingState
} from '../base';
import {
    connectionService,
    errorService,
    type CategorizedError
} from '../../services/medplum';
import type { ResourceHookConfig } from './ResourceConfig';
import { getEnhancementStrategies } from './EnhancementStrategies';
import { createLogger } from '../../utils/logger';

// Initialize logger
const logger = createLogger('ResourceFactory');

/**
 * Generated resource hook interface
 */
export interface GeneratedResourceHook<T extends Resource = Resource> {
    // Data state
    data: T | T[] | null;
    enhancedData: EnhancedResource<T> | EnhancedResource<T>[] | null;
    selectedItem: T | null;
    enhancedSelectedItem: EnhancedResource<T> | null;

    // Loading states
    loading: LoadingState;
    isLoading: boolean;
    isInitialLoading: boolean;

    // Error state
    error: CategorizedError | null;

    // Connection state
    isOnline: boolean;
    isOffline: boolean;
    hasPendingChanges: boolean;

    // Pagination state (if enabled)
    pagination: PaginationState;

    // Filter state (if enabled)
    filters: FilterState;

    // CRUD operations
    fetchOne: (id: string) => Promise<T>;
    fetchMany: (options?: { filters?: any; pagination?: any; sort?: any }) => Promise<T[]>;
    search: (query: Record<string, any>) => Promise<T[]>;
    create: (data: Partial<T>) => Promise<T>;
    update: (id: string, data: Partial<T>) => Promise<T>;
    delete: (id: string) => Promise<void>;

    // Data management
    refetch: () => Promise<void>;
    selectItem: (item: T | null) => void;

    // State management actions
    setLoading: (type: keyof LoadingState, loading: boolean) => void;
    setError: (error: CategorizedError | null) => void;
    clearError: () => void;

    // Pagination actions (if enabled)
    setPage?: (page: number) => void;
    setPageSize?: (pageSize: number) => void;
    setPagination?: (pagination: Partial<PaginationState>) => void;

    // Filter actions (if enabled)
    setFilters?: (filters: Partial<FilterState>) => void;
    setFilter?: (key: string, value: any) => void;
    clearFilters?: () => void;
    setSearchTerm?: (term: string) => void;
    setSort?: (field: string, order?: 'asc' | 'desc') => void;

    // Cache management
    clearCache: () => void;
    syncPending: () => Promise<void>;

    // Utility functions
    getComputedProperty: <K extends string>(property: K) => any;
    resetState: () => void;

    // Configuration access
    config: ResourceHookConfig<T>;
    resourceType: ResourceType;
}

/**
 * Factory options for customizing the generated hook
 */
export interface ResourceFactoryOptions<T extends Resource = Resource> {
    // Override default configurations
    crudOverrides?: Partial<BaseCRUDOptions<T>>;
    cacheOverrides?: Partial<ResourceCacheOptions>;
    enhancementOverrides?: Partial<ResourceEnhancementOptions<T>>;
    stateOverrides?: Partial<BaseStateOptions>;

    // Custom enhancement strategies
    customEnhancements?: ResourceEnhancementOptions<T>['strategies'];

    // Enable/disable features
    disableEnhancement?: boolean;
    disableCache?: boolean;
    disablePagination?: boolean;
    disableFilters?: boolean;

    // Event handlers
    onDataChange?: (data: T | T[] | null) => void;
    onError?: (error: CategorizedError) => void;
    onStateChange?: (state: any) => void;
}

/**
 * Main factory function to create resource-specific hooks
 */
export function createResourceHook<T extends Resource = Resource>(
    config: ResourceHookConfig<T>,
    options: ResourceFactoryOptions<T> = {}
) {
    /**
     * Generated resource hook
     */
    function useGeneratedResourceHook(): GeneratedResourceHook<T> {
        const {
            crudOverrides = {},
            cacheOverrides = {},
            enhancementOverrides = {},
            stateOverrides = {},
            customEnhancements = [],
            disableEnhancement = !config.features.enableEnhancement,
            disableCache = !config.features.enableCaching,
            disablePagination = !config.features.enablePagination,
            disableFilters = !config.features.enableSearch,
            onDataChange,
            onError,
            onStateChange
        } = options;

        logger.debug(`Initializing generated hook for ${config.resourceType}`);

        // Initialize base hooks with configuration
        const crud = useBaseCRUD<T>({
            resourceType: config.resourceType,
            enableOffline: config.features.enableOffline ?? true,
            enableCache: !disableCache,
            ...config.crud,
            ...crudOverrides,
            onError: (error) => {
                onError?.(error);
                if (config.validation?.custom && crud.data) {
                    const validationError = config.validation.custom(crud.data as T);
                    if (validationError) {
                        const categorizedError = errorService.categorizeError(new Error(validationError));
                        onError?.(categorizedError);
                    }
                }
            }
        });

        const cache = useResourceCache<T>({
            resourceType: config.resourceType,
            enableAutoCleanup: true,
            ...config.cache,
            ...cacheOverrides
        });

        // Prepare enhancement strategies
        const enhancementStrategies = React.useMemo(() => {
            if (disableEnhancement) return [];

            const defaultStrategies = getEnhancementStrategies<T>(config.resourceType);
            return [...defaultStrategies, ...customEnhancements];
        }, [disableEnhancement, customEnhancements]);

        const enhancement = useResourceEnhancement<T>({
            resourceType: config.resourceType,
            strategies: enhancementStrategies,
            enableMemoization: true,
            ...config.enhancement,
            ...enhancementOverrides,
            onEnhancementError: (error, resource, strategy) => {
                logger.warn(`Enhancement strategy '${strategy}' failed for ${config.resourceType}:`, error);
            }
        });

        const [state, actions] = useBaseState<T>({
            enablePagination: !disablePagination,
            enableFilters: !disableFilters,
            enableSearch: config.features.enableSearch ?? true,
            enableOptimisticUpdates: config.features.enableOptimisticUpdates ?? false,
            ...config.state,
            ...stateOverrides,
            onStateChange
        });

        // Track connection state
        React.useEffect(() => {
            const unsubscribe = connectionService.subscribe((connectionState) => {
                actions.setOfflineStatus(!connectionState.isOnline || !connectionState.isServerAvailable);
            });

            return unsubscribe;
        }, [actions]);

        // Enhanced data with computed properties
        const enhancedData = React.useMemo(() => {
            if (disableEnhancement || !crud.data) return null;

            if (Array.isArray(crud.data)) {
                return enhancement.enhanceResources(crud.data);
            } else {
                return enhancement.enhanceResource(crud.data);
            }
        }, [crud.data, enhancement, disableEnhancement]);

        const enhancedSelectedItem = React.useMemo(() => {
            if (disableEnhancement || !state.selectedItem) return null;
            return enhancement.enhanceResource(state.selectedItem);
        }, [state.selectedItem, enhancement, disableEnhancement]);

        // Notify of data changes
        React.useEffect(() => {
            if (onDataChange && crud.data !== null) {
                onDataChange(crud.data);
            }
        }, [crud.data, onDataChange]);

        // Helper function to get computed properties safely
        const getComputedProperty = React.useCallback(<K extends string>(property: K): any => {
            if (disableEnhancement) return undefined;

            if (enhancedSelectedItem) {
                return enhancement.getComputedProperty(enhancedSelectedItem, property);
            }

            if (enhancedData && !Array.isArray(enhancedData)) {
                return enhancement.getComputedProperty(enhancedData, property);
            }

            return undefined;
        }, [enhancement, enhancedSelectedItem, enhancedData, disableEnhancement]);

        // Use refs for stable action references to prevent infinite loops
        const actionsRef = React.useRef(actions);
        const stateRef = React.useRef(state);
        actionsRef.current = actions;
        stateRef.current = state;

        // Store crud operations in a ref to ensure stability
        const crudRef = React.useRef(crud);
        crudRef.current = crud;

        // Enhanced CRUD operations that update state - with stable dependencies
        const enhancedFetchOne = React.useCallback(async (id: string): Promise<T> => {
            if (!id) {
                throw new Error('ID is required for fetchOne operation');
            }

            actionsRef.current.setLoading('initial', true);
            actionsRef.current.clearError();
            
            try {
                const result = await crudRef.current.fetchOne(id);
                actionsRef.current.setData(result);
                actionsRef.current.setLoading('initial', false);
                return result;
            } catch (error) {
                const categorizedError = errorService.categorizeError(error as Error);
                actionsRef.current.setError(categorizedError);
                actionsRef.current.setLoading('initial', false);
                throw categorizedError;
            }
        }, []); // No dependencies - use refs for stable function

        const enhancedFetchMany = React.useCallback(async (options?: any): Promise<T[]> => {
            const currentState = stateRef.current;
            const currentActions = actionsRef.current;
            const loadingType = currentState.data ? 'refresh' : 'initial';
            
            currentActions.setLoading(loadingType, true);
            currentActions.clearError();

            try {
                const result = await crudRef.current.fetchMany(options);
                currentActions.setData(result);

                // Update pagination if enabled
                if (!disablePagination && result.length > 0) {
                    currentActions.setPagination?.({
                        total: result.length, // This would come from server in real implementation
                        hasNextPage: result.length === currentState.pagination.pageSize,
                        hasPreviousPage: currentState.pagination.page > 0
                    });
                }

                currentActions.setLoading(loadingType, false);
                return result;
            } catch (error) {
                const categorizedError = errorService.categorizeError(error as Error);
                currentActions.setError(categorizedError);
                currentActions.setLoading(loadingType, false);
                throw categorizedError;
            }
        }, [disablePagination]); // Only stable dependencies

        const enhancedSearch = React.useCallback(async (query: Record<string, any>): Promise<T[]> => {
            const currentActions = actionsRef.current;
            currentActions.setLoading('search', true);
            currentActions.clearError();
            
            try {
                const result = await crudRef.current.search(query);
                currentActions.setData(result);
                currentActions.setLoading('search', false);
                return result;
            } catch (error) {
                const categorizedError = errorService.categorizeError(error as Error);
                currentActions.setError(categorizedError);
                currentActions.setLoading('search', false);
                throw categorizedError;
            }
        }, []); // No dependencies - use refs

        // Store config in ref for stability
        const configRef = React.useRef(config);
        configRef.current = config;

        const enhancedCreate = React.useCallback(async (data: Partial<T>): Promise<T> => {
            const currentActions = actionsRef.current;
            const currentState = stateRef.current;
            currentActions.setLoading('create', true);
            currentActions.clearError();

            try {
                // Validate required fields
                if (configRef.current.validation?.required) {
                    for (const field of configRef.current.validation.required) {
                        if (!data[field]) {
                            throw new Error(`${String(field)} is required`);
                        }
                    }
                }

                // Custom validation
                if (configRef.current.validation?.custom) {
                    const validationError = configRef.current.validation.custom(data as T);
                    if (validationError) {
                        throw new Error(validationError);
                    }
                }

                const result = await crudRef.current.create(data);

                // Update state based on current data type
                if (Array.isArray(currentState.data)) {
                    currentActions.setData([result, ...currentState.data]);
                } else {
                    currentActions.setData(result);
                }

                currentActions.setLoading('create', false);
                return result;
            } catch (error) {
                const categorizedError = errorService.categorizeError(error as Error);
                currentActions.setError(categorizedError);
                currentActions.setLoading('create', false);
                throw categorizedError;
            }
        }, []); // No dependencies - use refs

        const enhancedUpdate = React.useCallback(async (id: string, data: Partial<T>): Promise<T> => {
            const currentActions = actionsRef.current;
            const currentState = stateRef.current;
            currentActions.setLoading('update', true);
            currentActions.clearError();

            try {
                const result = await crudRef.current.update(id, data);

                // Update state based on current data type
                if (Array.isArray(currentState.data)) {
                    const updatedData = currentState.data.map(item =>
                        item.id === id ? result : item
                    );
                    currentActions.setData(updatedData);
                } else {
                    currentActions.setData(result);
                }

                if (currentState.selectedItem?.id === id) {
                    currentActions.selectItem(result);
                }

                currentActions.setLoading('update', false);
                return result;
            } catch (error) {
                const categorizedError = errorService.categorizeError(error as Error);
                currentActions.setError(categorizedError);
                currentActions.setLoading('update', false);
                throw categorizedError;
            }
        }, []); // No dependencies - use refs

        const enhancedDelete = React.useCallback(async (id: string): Promise<void> => {
            const currentActions = actionsRef.current;
            const currentState = stateRef.current;
            currentActions.setLoading('delete', true);
            currentActions.clearError();

            try {
                await crudRef.current.delete(id);

                // Update state based on current data type
                if (Array.isArray(currentState.data)) {
                    const filteredData = currentState.data.filter(item => item.id !== id);
                    currentActions.setData(filteredData);
                } else if (currentState.data?.id === id) {
                    currentActions.setData(null);
                }

                if (currentState.selectedItem?.id === id) {
                    currentActions.selectItem(null);
                }

                currentActions.setLoading('delete', false);
            } catch (error) {
                const categorizedError = errorService.categorizeError(error as Error);
                currentActions.setError(categorizedError);
                currentActions.setLoading('delete', false);
                throw categorizedError;
            }
        }, []); // No dependencies - use refs

        // Enhanced refetch that maintains state - with stable dependencies
        const enhancedRefetch = React.useCallback(async (): Promise<void> => {
            const currentState = stateRef.current;
            if (Array.isArray(currentState.data)) {
                await enhancedFetchMany();
            } else if (currentState.data?.id) {
                await enhancedFetchOne(currentState.data.id);
            }
        }, []); // No dependencies - functions are already stable

        // Calculate derived loading states
        const isLoading = React.useMemo(() => {
            return Object.values(state.loading).some(Boolean);
        }, [state.loading]);

        const isInitialLoading = state.loading.initial;

        // Reset state with proper cleanup
        const resetState = React.useCallback(() => {
            actions.reset();
            cache.clear();
            enhancement.clearCache();
        }, [actions, cache, enhancement]);

        // Build the hook interface based on enabled features
        const hookInterface: GeneratedResourceHook<T> = {
            // Data state
            data: state.data,
            enhancedData,
            selectedItem: state.selectedItem,
            enhancedSelectedItem,

            // Loading states
            loading: state.loading,
            isLoading,
            isInitialLoading,

            // Error state
            error: state.error,

            // Connection state
            isOnline: !state.isOffline,
            isOffline: state.isOffline,
            hasPendingChanges: state.hasPendingChanges,

            // Pagination state
            pagination: state.pagination,

            // Filter state
            filters: state.filters,

            // CRUD operations
            fetchOne: enhancedFetchOne,
            fetchMany: enhancedFetchMany,
            search: enhancedSearch,
            create: enhancedCreate,
            update: enhancedUpdate,
            delete: enhancedDelete,

            // Data management
            refetch: enhancedRefetch,
            selectItem: actions.selectItem,

            // State management
            setLoading: actions.setLoading,
            setError: actions.setError,
            clearError: actions.clearError,

            // Cache management
            clearCache: cache.clear,
            syncPending: crud.syncPending,

            // Utility functions
            getComputedProperty,
            resetState,

            // Configuration access
            config,
            resourceType: config.resourceType
        };

        // Add pagination methods if enabled
        if (!disablePagination) {
            hookInterface.setPage = actions.setPage;
            hookInterface.setPageSize = actions.setPageSize;
            hookInterface.setPagination = actions.setPagination;
        }

        // Add filter methods if enabled
        if (!disableFilters) {
            hookInterface.setFilters = actions.setFilters;
            hookInterface.setFilter = actions.setFilter;
            hookInterface.clearFilters = actions.clearFilters;
            hookInterface.setSearchTerm = actions.setSearchTerm;
            hookInterface.setSort = actions.setSort;
        }

        return hookInterface;
    }

    // Set displayName for debugging
    useGeneratedResourceHook.displayName = `use${config.resourceType}`;

    return useGeneratedResourceHook;
}

/**
 * Convenience function to create a resource hook with default configuration
 */
export function createSimpleResourceHook<T extends Resource = Resource>(
    resourceType: ResourceType,
    options: ResourceFactoryOptions<T> = {}
) {
    const config: ResourceHookConfig<T> = {
        resourceType,
        features: {
            enableCRUD: true,
            enableCaching: true,
            enableEnhancement: false,
            enablePagination: false,
            enableSearch: false,
            enableOffline: true,
            enableOptimisticUpdates: false
        }
    };

    return createResourceHook(config, options);
}

/**
 * Helper to validate resource hook configuration
 */
export function validateResourceConfig<T extends Resource = Resource>(
    config: ResourceHookConfig<T>
): string[] {
    const errors: string[] = [];

    if (!config.resourceType) {
        errors.push('resourceType is required');
    }

    if (!config.features) {
        errors.push('features configuration is required');
    }

    if (config.features.enablePagination && !config.features.enableSearch) {
        errors.push('enableSearch must be true when enablePagination is true');
    }

    if (config.validation?.required && !Array.isArray(config.validation.required)) {
        errors.push('validation.required must be an array');
    }

    return errors;
}