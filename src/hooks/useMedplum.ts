import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
  ReactNode,
  ReactElement
} from 'react';
import { Resource, ResourceType } from '@medplum/fhirtypes';
// Import MedplumClient type
import { MedplumClient } from '@medplum/core';
// Import the singleton Medplum client from our centralized implementation
import { medplumClient, isServerConnected, checkServerConnection } from '../lib/medplum/client';
import { createLogger } from '../utils/logger';
import { FilterParams, PaginationParams, SortParams } from '../services/models';

// Initialize logger for this module
const logger = createLogger('useMedplum');

// Define the shape of the Medplum context using type intersection
type MedplumContextType = MedplumClient & {
  isInitialized: boolean;
  isServerAvailable: boolean;
  isOnline: boolean;
  isSyncing: boolean;
  syncError: Error | null;
  error: Error | null;
  // Additional methods
  fetchResources: <T extends Resource>(resourceType: ResourceType, options: { filters?: FilterParams; pagination?: PaginationParams; sort?: SortParams }) => Promise<T[]>;
  syncPendingChanges: () => Promise<void>;
  hasPendingChanges: () => boolean;
}

// Create a context for Medplum
const MedplumContext = createContext<MedplumContextType | undefined>(undefined);

/**
 * Custom hook to provide Medplum client functionality
 * Uses the singleton client from lib/medplum/client.ts
 * Implements offline-first and type-safe resource management
 */
export function useMedplum(): MedplumContextType {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isServerAvailable, setIsServerAvailable] = useState(isServerConnected());
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<Error | null>(null);

  // return error is medplumClient is null
  if (!medplumClient) {
    throw new Error('Medplum client is not initialized');
  }

  // Update online status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Check if client is already initialized
    const checkClientStatus = async () => {
      try {
        // Check if we have an active login or access token
        const hasToken = !!medplumClient!.getAccessToken();

        if (hasToken) {
          // Verify token is valid by checking profile
          try {
            await medplumClient!.getProfileAsync();
            setIsInitialized(true);
          } catch (profileError) {
            logger.warn('Token exists but profile check failed:', profileError);
            // We still consider the client initialized, even if the token is invalid
            // Auth will be handled by the auth provider
            setIsInitialized(true);
          }
        } else {
          // No token, but client is still initialized
          setIsInitialized(true);
        }

        // Update server availability status
        setIsServerAvailable(isServerConnected());
      } catch (err) {
        logger.error('Error checking Medplum client status:', err);
        setError(err instanceof Error ? err : new Error('Unknown client status error'));
        setIsInitialized(true); // Still mark as initialized to prevent hanging
      }
    };

    checkClientStatus();

    // Set up periodic server availability check
    const intervalId = setInterval(() => {
      setIsServerAvailable(isServerConnected());
    }, 30000); // Check every 30 seconds

    return () => clearInterval(intervalId);
  }, []);

  // Sync pending changes when back online
  useEffect(() => {
    if (isOnline) {
      syncPendingChanges();
    }
  }, [isOnline]);

  /**
   * Function to check if there are pending changes to sync
   */
  const hasPendingChanges = useCallback(() => {
    if (typeof localStorage === 'undefined') return false;

    const pendingCreates = JSON.parse(localStorage.getItem('medplum.pending.creates') || '[]');
    const pendingUpdates = JSON.parse(localStorage.getItem('medplum.pending.updates') || '[]');
    const pendingDeletes = JSON.parse(localStorage.getItem('medplum.pending.deletes') || '[]');

    return pendingCreates.length > 0 || pendingUpdates.length > 0 || pendingDeletes.length > 0;
  }, []);

  /**
   * Sync pending changes that were made while offline
   */
  const syncPendingChanges = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    try {
      setIsSyncing(true);
      setSyncError(null);

      // Process pending creates
      const pendingCreates = JSON.parse(localStorage.getItem('medplum.pending.creates') || '[]');
      if (pendingCreates.length > 0) {
        for (const item of pendingCreates) {
          try {
            // Cast the resource type to ensure type safety with FHIR resources
            const fhirResourceType = item.resource as ResourceType;
            await medplumClient!.createResource({
              resourceType: item.resource,
              ...item.variables,
            });
          } catch (error) {
            logger.error(`Error syncing create for ${item.resource}:`, error);
          }
        }
        localStorage.setItem('medplum.pending.creates', '[]');
      }

      // Process pending updates
      const pendingUpdates = JSON.parse(localStorage.getItem('medplum.pending.updates') || '[]');
      if (pendingUpdates.length > 0) {
        for (const item of pendingUpdates) {
          try {
            const current = await medplumClient!.readResource(item.resource, item.id);
            const updated = { ...current, ...item.variables };
            await medplumClient!.updateResource(updated);
          } catch (error) {
            logger.error(`Error syncing update for ${item.resource}/${item.id}:`, error);
          }
        }
        localStorage.setItem('medplum.pending.updates', '[]');
      }

      // Process pending deletes
      const pendingDeletes = JSON.parse(localStorage.getItem('medplum.pending.deletes') || '[]');
      if (pendingDeletes.length > 0) {
        for (const item of pendingDeletes) {
          try {
            const current = await medplumClient!.readResource(item.resource as ResourceType, item.id);
            // Handle different resource types with appropriate status values
            let deleted: Resource;

            if (current.resourceType === 'Patient' || current.resourceType === 'Practitioner') {
              deleted = {
                ...current,
                active: false // For Patient and Practitioner, use 'active' flag instead of status
              };
            } else if (current.resourceType === 'Observation') {
              deleted = {
                ...current,
                status: 'entered-in-error' as const // For Observation
              };
            } else if (current.resourceType === 'DiagnosticReport') {
              deleted = {
                ...current,
                status: 'cancelled' as const // For DiagnosticReport
              };
            } else if (current.resourceType === 'MedicationRequest') {
              deleted = {
                ...current,
                status: 'cancelled' as const // For MedicationRequest
              };
            } else if (current.resourceType === 'Appointment') {
              deleted = {
                ...current,
                status: 'cancelled' as const // For Appointment
              };
            } else {
              // Generic approach for other resources
              deleted = {
                ...current,
                meta: {
                  ...current.meta,
                  tag: [...(current.meta?.tag || []), {
                    system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationValue',
                    code: 'DELETED',
                    display: 'Deleted'
                  }]
                }
              };
            }
            await medplumClient!.updateResource(deleted);
          } catch (error) {
            logger.error(`Error syncing delete for ${item.resource}/${item.id}:`, error);
          }
        }
        localStorage.setItem('medplum.pending.deletes', '[]');
      }

    } catch (error) {
      logger.error('Error during sync:', error);
      setSyncError(error as Error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing]);

  /**
   * Update a FHIR resource
   * @param resource Resource to update
   * @returns Updated resource or throws an error
   */
  const updateResource = async <T extends Resource>(resource: T): Promise<T> => {
    try {
      logger.debug(`Updating resource: ${resource.resourceType}/${resource.id}`);

      const isConnected = await checkServerConnection();

      if (!isConnected) {
        logger.warn(`Cannot update ${resource.resourceType}/${resource.id} while offline`);
        // Store the update request for later sync
        const pendingUpdates = JSON.parse(localStorage.getItem(`medplum.pending.updates`) || '[]');
        pendingUpdates.push({
          resource: resource.resourceType,
          id: resource.id,
          variables: resource,
          timestamp: Date.now()
        });
        localStorage.setItem(`medplum.pending.updates`, JSON.stringify(pendingUpdates));

        // Update local cache for UI purposes
        const cacheKey = `medplum.${resource.resourceType}.${resource.id}`;
        localStorage.setItem(cacheKey, JSON.stringify(resource));

        return resource;
      }

      const updatedResource = await medplumClient!.updateResource(resource) as T;
      if (!updatedResource) {
        throw new Error(`Failed to update ${resource.resourceType}/${resource.id}`);
      }

      // Update cache
      const cacheKey = `medplum.${resource.resourceType}.${resource.id}`;
      localStorage.setItem(cacheKey, JSON.stringify(updatedResource));

      return updatedResource;
    } catch (err) {
      logger.error('Error updating resource:', err);
      throw err; // Propagate the error for proper handling in components
    }
  };

  /**
   * Create a new FHIR resource
   * @param resource Resource to create
   * @returns Created resource or throws an error
   */
  const createResource = async <T extends Resource>(resource: T): Promise<T> => {
    try {
      logger.debug(`Creating resource: ${resource.resourceType}`);

      const isConnected = await checkServerConnection();

      if (!isConnected) {
        logger.warn(`Cannot create ${resource.resourceType} while offline`);
        // Store the create request for later sync
        const pendingCreates = JSON.parse(localStorage.getItem(`medplum.pending.creates`) || '[]');
        pendingCreates.push({
          resource: resource.resourceType,
          variables: resource,
          timestamp: Date.now()
        });
        localStorage.setItem(`medplum.pending.creates`, JSON.stringify(pendingCreates));

        // Create a temporary ID for UI purposes
        const tempId = `temp-${Date.now()}`;
        const tempResource = {
          ...resource,
          id: tempId,
          _tempId: true,
        } as T;

        return tempResource;
      }

      const createdResource = await medplumClient!.createResource(resource) as T;
      if (!createdResource) {
        throw new Error(`Failed to create ${resource.resourceType} resource`);
      }

      // Cache the result
      if (createdResource.id) {
        const cacheKey = `medplum.${resource.resourceType}.${createdResource.id}`;
        localStorage.setItem(cacheKey, JSON.stringify(createdResource));
      }

      return createdResource;
    } catch (err) {
      logger.error('Error creating resource:', err);
      throw err; // Propagate the error for proper handling in components
    }
  };

  /**
   * Read a specific resource by ID
   * @param resourceType FHIR resource type
   * @param id Resource ID
   * @returns Resource or throws an error
   */
  const readResource = async <T extends Resource>(
    resourceType: ResourceType,
    id: string
  ): Promise<T> => {
    try {
      // Validate inputs
      if (!resourceType) {
        throw new Error('Resource type is required');
      }

      if (!id) {
        throw new Error('Resource ID is required');
      }

      logger.debug(`Reading resource: ${resourceType}/${id}`);

      const isConnected = await checkServerConnection();

      if (!isConnected) {
        logger.warn(`Operating in offline mode for ${resourceType}/${id} request`);
        // Return cached data if available
        const cachedData = localStorage.getItem(`medplum.${resourceType}.${id}`);
        if (cachedData) {
          return JSON.parse(cachedData) as T;
        }
        throw new Error(`Resource ${resourceType}/${id} not available offline`);
      }

      const resource = await medplumClient!.readResource(resourceType, id) as T;
      if (!resource) {
        throw new Error(`Resource ${resourceType}/${id} not found`);
      }

      // Cache the result for offline use
      localStorage.setItem(`medplum.${resourceType}.${id}`, JSON.stringify(resource));

      return resource;
    } catch (err) {
      logger.error(`Error reading resource ${resourceType}/${id}:`, err);
      throw err; // Propagate the error for proper handling in components
    }
  };

  /**
   * Fetch resources with optional filters, pagination, and sorting
   * @param options Options for fetching resources
   * @returns Promise that resolves to an array of resources
   */
  const fetchResources = async <T extends Resource>(
    resourceType: ResourceType,
    options: { filters?: FilterParams; pagination?: PaginationParams; sort?: SortParams }
  ): Promise<T[]> => {
    try {
      // Normalize filters to remove undefined or empty values
      const normalizedFilters = options.filters ?
        Object.fromEntries(
          Object.entries(options.filters).filter(
            ([_, value]) => value !== undefined && value !== null && value !== ''
          )
        ) :
        {};

      // Build search parameters for Medplum client
      // Using individual search parameters instead of a _filter expression
      const searchParams: Record<string, string> = {};

      // Map each filter to its own search parameter
      for (const [key, value] of Object.entries(normalizedFilters)) {
        // Skip the _filter key if it was passed directly (legacy support)
        if (key !== '_filter') {
          searchParams[key] = String(value);
        }
      }

      // Log the search parameters for debugging
      logger.debug('Searching with parameters', { searchParams, resourceType });

      // Use searchResources with individual parameters
      const resources = await medplumClient!.searchResources(
        resourceType as any,
        searchParams
      ) as unknown as T[];

      // Optional: Cache resources for offline use
      if (resources.length > 0) {
        localStorage.setItem(`medplum.${resourceType}.list`, JSON.stringify(resources));
      }

      logger.info(`Successfully fetched ${resources.length} ${resourceType} resources`, {
        resourceType,
        count: resources.length,
        filters: normalizedFilters
      });

      return resources;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      logger.error('Error fetching resources', {
        resourceType,
        errorMessage: error.message,
        filters: options.filters
      });

      // Throw a more informative error
      throw new Error(`Failed to fetch ${resourceType} resources: ${error.message}`);
    }
  };

  /**
   * Delete a resource by ID
   * @param resourceType FHIR resource type
   * @param id Resource ID
   * @returns Promise that resolves when the resource is deleted
   */
  const deleteResource = async <T extends Resource>(
    resourceType: ResourceType,
    id: string
  ): Promise<T> => {
    try {
      logger.debug(`Deleting resource: ${resourceType}/${id}`);

      const isConnected = await checkServerConnection();

      if (!isConnected) {
        logger.warn(`Cannot delete ${resourceType}/${id} while offline`);
        // Store the delete request for later sync
        const pendingDeletes = JSON.parse(localStorage.getItem(`medplum.pending.deletes`) || '[]');
        pendingDeletes.push({
          resource: resourceType,
          id: id,
          timestamp: Date.now()
        });
        localStorage.setItem(`medplum.pending.deletes`, JSON.stringify(pendingDeletes));

        return {} as T;
      }

      await medplumClient!.deleteResource(resourceType, id);
      return {} as T;
    } catch (err) {
      logger.error(`Error deleting resource ${resourceType}/${id}:`, err);
      throw err; // Propagate the error for proper handling in components
    }
  };

  // Return the enhanced context that combines MedplumClient with our custom properties
  return {
    // Spread all methods and properties from the MedplumClient
    ...medplumClient,
    // Add our custom state properties
    isInitialized,
    isServerAvailable,
    isOnline,
    isSyncing,
    syncError,
    error,
    // Override with our offline-aware implementations
    updateResource,
    createResource,
    readResource,
    deleteResource, // This is explicitly included here
    // Add our custom methods
    fetchResources,
    syncPendingChanges,
    hasPendingChanges
  } as MedplumContextType;
}

/**
 * Medplum Provider component to wrap the application
 * @param props React children components
 */
export function MedplumProvider(
  props: { children: ReactNode }
): ReactElement {
  const medplumContext = useMedplum();

  return React.createElement(
    MedplumContext.Provider,
    { value: medplumContext },
    props.children
  );
}

/**
 * Hook to access Medplum context
 */
export function useMedplumContext(): MedplumContextType {
  const context = useContext(MedplumContext);
  if (context === undefined) {
    throw new Error('useMedplumContext must be used within a MedplumProvider');
  }
  return context;
}