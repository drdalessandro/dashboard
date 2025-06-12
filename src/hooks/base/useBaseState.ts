/**
 * useBaseState.ts
 * 
 * Common state management patterns for FHIR resource hooks
 * Provides consistent loading, error, data, and sync state management
 * Eliminates state management duplication across resource hooks
 */

import React from 'react';
import { Resource } from '@medplum/fhirtypes';
import { type CategorizedError } from '../../services/medplum';
import { createLogger } from '../../utils/logger';

// Initialize logger
const logger = createLogger('useBaseState');

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface FilterState {
  [key: string]: any;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface LoadingState {
  initial: boolean;
  refresh: boolean;
  pagination: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  search: boolean;
}

export interface BaseResourceState<T extends Resource = Resource> {
  // Data state
  data: T | T[] | null;
  selectedItem: T | null;
  
  // Loading states
  loading: LoadingState;
  
  // Error state
  error: CategorizedError | null;
  
  // Pagination state
  pagination: PaginationState;
  
  // Filter/search state
  filters: FilterState;
  
  // Sync state
  isOffline: boolean;
  hasPendingChanges: boolean;
  lastSyncTime: Date | null;
  syncStatus: 'synced' | 'syncing' | 'pending' | 'error';
  
  // Meta state
  lastUpdated: Date | null;
  isInitialized: boolean;
}

export interface BaseStateActions<T extends Resource = Resource> {
  // Data actions
  setData: (data: T | T[] | null) => void;
  updateData: (updater: (current: T | T[] | null) => T | T[] | null) => void;
  selectItem: (item: T | null) => void;
  
  // Loading actions
  setLoading: (type: keyof LoadingState, loading: boolean) => void;
  setAllLoading: (loading: boolean) => void;
  
  // Error actions
  setError: (error: CategorizedError | null) => void;
  clearError: () => void;
  
  // Pagination actions
  setPagination: (pagination: Partial<PaginationState>) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  
  // Filter actions
  setFilters: (filters: Partial<FilterState>) => void;
  setFilter: (key: string, value: any) => void;
  clearFilters: () => void;
  setSearchTerm: (term: string) => void;
  setSort: (field: string, order?: 'asc' | 'desc') => void;
  
  // Sync actions
  setSyncStatus: (status: BaseResourceState['syncStatus']) => void;
  setOfflineStatus: (isOffline: boolean) => void;
  setPendingChanges: (hasPending: boolean) => void;
  updateLastSync: () => void;
  
  // Utility actions
  reset: () => void;
  resetFilters: () => void;
  resetPagination: () => void;
}

export interface BaseStateOptions {
  initialPageSize?: number;
  enablePagination?: boolean;
  enableFilters?: boolean;
  enableSearch?: boolean;
  enableOptimisticUpdates?: boolean;
  onStateChange?: (state: BaseResourceState) => void;
}

/**
 * Default state values
 */
const createDefaultState = <T extends Resource = Resource>(
  options: BaseStateOptions = {}
): BaseResourceState<T> => ({
  data: null,
  selectedItem: null,
  loading: {
    initial: false,
    refresh: false,
    pagination: false,
    create: false,
    update: false,
    delete: false,
    search: false
  },
  error: null,
  pagination: {
    page: 0,
    pageSize: options.initialPageSize || 10,
    total: 0,
    hasNextPage: false,
    hasPreviousPage: false
  },
  filters: {},
  isOffline: false,
  hasPendingChanges: false,
  lastSyncTime: null,
  syncStatus: 'synced',
  lastUpdated: null,
  isInitialized: false
});

/**
 * Base state management hook for FHIR resources
 */
export function useBaseState<T extends Resource = Resource>(
  options: BaseStateOptions = {}
): [BaseResourceState<T>, BaseStateActions<T>] {
  const {
    enablePagination = true,
    enableFilters = true,
    enableSearch = true,
    enableOptimisticUpdates = false,
    onStateChange
  } = options;

  const [state, setState] = React.useState<BaseResourceState<T>>(() => 
    createDefaultState<T>(options)
  );

  // Notify of state changes
  React.useEffect(() => {
    if (onStateChange) {
      onStateChange(state);
    }
  }, [state, onStateChange]);

  /**
   * Update state with validation and logging
   */
  const updateState = React.useCallback((
    updater: (current: BaseResourceState<T>) => Partial<BaseResourceState<T>>
  ) => {
    setState(current => {
      const updates = updater(current);
      const newState = { ...current, ...updates, lastUpdated: new Date() };
      
      logger.debug('State updated', { 
        updates: Object.keys(updates),
        hasData: !!newState.data,
        isLoading: Object.values(newState.loading).some(Boolean),
        hasError: !!newState.error
      });
      
      return newState;
    });
  }, []);

  // Data actions
  const setData = React.useCallback((data: T | T[] | null) => {
    updateState(() => ({ 
      data, 
      isInitialized: true,
      lastUpdated: new Date()
    }));
  }, [updateState]);

  const updateData = React.useCallback((
    updater: (current: T | T[] | null) => T | T[] | null
  ) => {
    updateState(current => ({ 
      data: updater(current.data),
      lastUpdated: new Date()
    }));
  }, [updateState]);

  const selectItem = React.useCallback((item: T | null) => {
    updateState(() => ({ selectedItem: item }));
  }, [updateState]);

  // Loading actions
  const setLoading = React.useCallback((type: keyof LoadingState, loading: boolean) => {
    updateState(current => ({
      loading: { ...current.loading, [type]: loading }
    }));
  }, [updateState]);

  const setAllLoading = React.useCallback((loading: boolean) => {
    updateState(current => ({
      loading: Object.keys(current.loading).reduce((acc, key) => ({
        ...acc,
        [key]: loading
      }), {} as LoadingState)
    }));
  }, [updateState]);

  // Error actions
  const setError = React.useCallback((error: CategorizedError | null) => {
    updateState(() => ({ error }));
  }, [updateState]);

  const clearError = React.useCallback(() => {
    updateState(() => ({ error: null }));
  }, [updateState]);

  // Pagination actions
  const setPagination = React.useCallback((pagination: Partial<PaginationState>) => {
    if (!enablePagination) return;
    
    updateState(current => ({
      pagination: { ...current.pagination, ...pagination }
    }));
  }, [updateState, enablePagination]);

  const setPage = React.useCallback((page: number) => {
    if (!enablePagination) return;
    
    updateState(current => ({
      pagination: {
        ...current.pagination,
        page,
        hasPreviousPage: page > 0,
        hasNextPage: page < Math.ceil(current.pagination.total / current.pagination.pageSize) - 1
      }
    }));
  }, [updateState, enablePagination]);

  const setPageSize = React.useCallback((pageSize: number) => {
    if (!enablePagination) return;
    
    updateState(current => {
      const totalPages = Math.ceil(current.pagination.total / pageSize);
      const currentPage = Math.min(current.pagination.page, totalPages - 1);
      
      return {
        pagination: {
          ...current.pagination,
          pageSize,
          page: Math.max(0, currentPage),
          hasNextPage: currentPage < totalPages - 1,
          hasPreviousPage: currentPage > 0
        }
      };
    });
  }, [updateState, enablePagination]);

  // Filter actions
  const setFilters = React.useCallback((filters: Partial<FilterState>) => {
    if (!enableFilters) return;
    
    updateState(current => ({
      filters: { ...current.filters, ...filters },
      pagination: enablePagination ? { ...current.pagination, page: 0 } : current.pagination
    }));
  }, [updateState, enableFilters, enablePagination]);

  const setFilter = React.useCallback((key: string, value: any) => {
    if (!enableFilters) return;
    
    updateState(current => ({
      filters: { ...current.filters, [key]: value },
      pagination: enablePagination ? { ...current.pagination, page: 0 } : current.pagination
    }));
  }, [updateState, enableFilters, enablePagination]);

  const clearFilters = React.useCallback(() => {
    if (!enableFilters) return;
    
    updateState(current => ({
      filters: {},
      pagination: enablePagination ? { ...current.pagination, page: 0 } : current.pagination
    }));
  }, [updateState, enableFilters, enablePagination]);

  const setSearchTerm = React.useCallback((term: string) => {
    if (!enableSearch) return;
    
    updateState(current => ({
      filters: { ...current.filters, searchTerm: term },
      pagination: enablePagination ? { ...current.pagination, page: 0 } : current.pagination
    }));
  }, [updateState, enableSearch, enablePagination]);

  const setSort = React.useCallback((field: string, order: 'asc' | 'desc' = 'asc') => {
    updateState(current => ({
      filters: { ...current.filters, sortBy: field, sortOrder: order }
    }));
  }, [updateState]);

  // Sync actions
  const setSyncStatus = React.useCallback((syncStatus: BaseResourceState['syncStatus']) => {
    updateState(() => ({ syncStatus }));
  }, [updateState]);

  const setOfflineStatus = React.useCallback((isOffline: boolean) => {
    updateState(() => ({ isOffline }));
  }, [updateState]);

  const setPendingChanges = React.useCallback((hasPendingChanges: boolean) => {
    updateState(() => ({ hasPendingChanges }));
  }, [updateState]);

  const updateLastSync = React.useCallback(() => {
    updateState(() => ({ 
      lastSyncTime: new Date(),
      syncStatus: 'synced' as const
    }));
  }, [updateState]);

  // Utility actions
  const reset = React.useCallback(() => {
    setState(createDefaultState<T>(options));
  }, [options]);

  const resetFilters = React.useCallback(() => {
    updateState(current => ({
      filters: {},
      pagination: enablePagination ? { ...current.pagination, page: 0 } : current.pagination
    }));
  }, [updateState, enablePagination]);

  const resetPagination = React.useCallback(() => {
    updateState(current => ({
      pagination: { ...current.pagination, page: 0 }
    }));
  }, [updateState]);

  // FIXED: Memoize actions object to prevent infinite loops
  const actions: BaseStateActions<T> = React.useMemo(() => ({
    setData,
    updateData,
    selectItem,
    setLoading,
    setAllLoading,
    setError,
    clearError,
    setPagination,
    setPage,
    setPageSize,
    setFilters,
    setFilter,
    clearFilters,
    setSearchTerm,
    setSort,
    setSyncStatus,
    setOfflineStatus,
    setPendingChanges,
    updateLastSync,
    reset,
    resetFilters,
    resetPagination
  }), [
    setData,
    updateData,
    selectItem,
    setLoading,
    setAllLoading,
    setError,
    clearError,
    setPagination,
    setPage,
    setPageSize,
    setFilters,
    setFilter,
    clearFilters,
    setSearchTerm,
    setSort,
    setSyncStatus,
    setOfflineStatus,
    setPendingChanges,
    updateLastSync,
    reset,
    resetFilters,
    resetPagination
  ]);

  return [state, actions];
}

/**
 * Hook for simple state management without pagination/filters
 */
export function useSimpleState<T extends Resource = Resource>() {
  return useBaseState<T>({
    enablePagination: false,
    enableFilters: false,
    enableSearch: false
  });
}

/**
 * Hook for list state management with pagination and filters
 */
export function useListState<T extends Resource = Resource>(
  pageSize: number = 10
) {
  return useBaseState<T>({
    initialPageSize: pageSize,
    enablePagination: true,
    enableFilters: true,
    enableSearch: true
  });
}

/**
 * Hook for detail state management (single resource)
 */
export function useDetailState<T extends Resource = Resource>() {
  return useBaseState<T>({
    enablePagination: false,
    enableFilters: false,
    enableSearch: false,
    enableOptimisticUpdates: true
  });
}

/**
 * Utility to check if any loading state is active
 */
export function isAnyLoading(loading: LoadingState): boolean {
  return Object.values(loading).some(Boolean);
}

/**
 * Utility to get active loading states
 */
export function getActiveLoadingStates(loading: LoadingState): string[] {
  return Object.entries(loading)
    .filter(([_, isLoading]) => isLoading)
    .map(([type]) => type);
}
