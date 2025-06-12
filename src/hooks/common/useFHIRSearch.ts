/**
 * useFHIRSearch Hook
 * Specialized hook for searching FHIR resources with offline capabilities
 * Optimized for healthcare applications in Mali and Sub-Saharan Africa
 */

import { useState, useEffect, useCallback } from 'react';
import { Resource } from '@medplum/fhirtypes';
import { useOfflineData } from './useOfflineData';
import { useSyncStatus } from './useSyncStatus';
import { SyncStatus } from '../../data/models/base';
import { filterResourcesBySearchQuery, sortResources } from '../../utils/fhir/searchUtils';

interface SearchParameters {
  /**
   * FHIR resource type to search (e.g., Patient, Practitioner)
   */
  resourceType: string;
  
  /**
   * Search text query
   */
  query?: string;
  
  /**
   * Field to sort by
   */
  sortField?: string;
  
  /**
   * Sort direction
   */
  sortDirection?: 'asc' | 'desc';
  
  /**
   * Number of results to fetch
   */
  limit?: number;
  
  /**
   * Pagination offset
   */
  offset?: number;
  
  /**
   * Additional FHIR search parameters
   */
  searchParams?: Record<string, string | string[]>;
  
  /**
   * Whether to include archived resources
   */
  includeArchived?: boolean;
  
  /**
   * Search only in locally available data
   */
  localOnly?: boolean;
}

interface SearchResult<T extends Resource = Resource> {
  /**
   * Found resources
   */
  resources: T[];
  
  /**
   * Whether loading is in progress
   */
  loading: boolean;
  
  /**
   * Error message if any
   */
  error: string | null;
  
  /**
   * Total count (may be estimated when offline)
   */
  totalCount: number;
  
  /**
   * Whether results are from local cache
   */
  isFromCache: boolean;
  
  /**
   * Current sync status
   */
  syncStatus: SyncStatus;
  
  /**
   * Pagination information
   */
  pagination: {
    offset: number;
    limit: number;
    totalPages: number;
    currentPage: number;
  };
  
  /**
   * Refresh search results
   */
  refresh: () => Promise<void>;
  
  /**
   * Set search parameters
   */
  setSearchParams: (params: Partial<SearchParameters>) => void;
}

/**
 * Custom hook for FHIR resource searching with offline support
 * Provides capabilities for healthcare workers to find patient data
 * even in low-connectivity environments
 * 
 * @param initialParams Initial search parameters
 * @param fetchFunction Function to fetch data from server
 * @returns Search results and controls
 */
export function useFHIRSearch<T extends Resource = Resource>(
  initialParams: SearchParameters,
  fetchFunction: (params: SearchParameters) => Promise<T[]>
): SearchResult<T> {
  // States
  const [searchParams, setSearchParams] = useState<SearchParameters>(initialParams);
  const [totalCount, setTotalCount] = useState<number>(0);
  const { isOnline } = useSyncStatus();
  
  // Create a cache key based on resource type
  const resourceType = searchParams.resourceType;
  
  // Use offline data hook for caching
  const {
    data: allData,
    loading,
    error,
    syncStatus,
    isFromCache,
    operations
  } = useOfflineData<T>({
    resourceType,
    fetchOnlineData: () => fetchFunction({ 
      ...searchParams, 
      // When fetching for cache, get all without pagination
      limit: undefined,
      offset: undefined
    }),
    backgroundSync: !searchParams.localOnly
  });
  
  // Filter and process data based on search parameters
  const processSearchResults = useCallback((): T[] => {
    let results = [...allData];
    
    // Apply filters
    if (searchParams.query) {
      results = filterResourcesBySearchQuery(
        results, 
        searchParams.query
      ) as T[];
    }
    
    // Apply additional search parameters
    if (searchParams.searchParams) {
      Object.entries(searchParams.searchParams).forEach(([param, value]) => {
        // Basic implementation - would need to be enhanced for FHIR-specific search
        results = results.filter(resource => {
          // Handle array of values (OR condition)
          if (Array.isArray(value)) {
            return value.some(v => 
              JSON.stringify(resource).toLowerCase().includes(v.toLowerCase())
            );
          }
          // Handle single value
          return JSON.stringify(resource).toLowerCase().includes(value.toLowerCase());
        });
      });
    }
    
    // Exclude archived resources unless specifically requested
    if (!searchParams.includeArchived) {
      results = results.filter(resource => {
        // Check if resource is archived (implementation may vary)
        return !resource.meta?.tag?.some(tag => 
          tag.system === 'http://gandall.org/fhir/archive-status' && 
          tag.code === 'archived'
        );
      });
    }
    
    // Sort results
    if (searchParams.sortField) {
      results = sortResources(
        results,
        searchParams.sortField,
        searchParams.sortDirection || 'asc'
      ) as T[];
    }
    
    // Store total count
    setTotalCount(results.length);
    
    // Apply pagination
    if (searchParams.limit) {
      const start = searchParams.offset || 0;
      const end = start + searchParams.limit;
      results = results.slice(start, end);
    }
    
    return results;
  }, [allData, searchParams]);
  
  // Processed and filtered resources
  const [resources, setResources] = useState<T[]>([]);
  
  // Update results when data or search parameters change
  useEffect(() => {
    const processedResults = processSearchResults();
    setResources(processedResults);
  }, [allData, searchParams, processSearchResults]);
  
  // Calculate pagination info
  const pagination = {
    offset: searchParams.offset || 0,
    limit: searchParams.limit || totalCount,
    totalPages: searchParams.limit ? Math.ceil(totalCount / searchParams.limit) : 1,
    currentPage: searchParams.limit ? 
      Math.floor((searchParams.offset || 0) / searchParams.limit) + 1 : 1
  };
  
  // Update search parameters
  const updateSearchParams = useCallback((params: Partial<SearchParameters>) => {
    setSearchParams(prev => ({ ...prev, ...params }));
  }, []);
  
  // Force refresh function
  const refresh = useCallback(async () => {
    if (isOnline && !searchParams.localOnly) {
      await operations.refresh();
    }
  }, [isOnline, operations, searchParams.localOnly]);
  
  return {
    resources,
    loading,
    error,
    totalCount,
    isFromCache,
    syncStatus,
    pagination,
    refresh,
    setSearchParams: updateSearchParams
  };
}

export default useFHIRSearch;
