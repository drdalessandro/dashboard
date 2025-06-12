/**
 * Medplum Data Provider for Refine
 * Implements FHIR-compliant data access with offline-first capabilities
 * Supports the healthcare platform's requirements for Sub-Saharan Africa and Mali
 */
import {
  DataProvider,
  BaseRecord,
  BaseKey,
  DeleteOneResponse,
  DeleteOneParams,
  CreateParams,
  CreateResponse,
  GetListParams,
  GetOneParams,
  UpdateParams,
  UpdateResponse,
  GetManyParams,
  GetManyResponse
} from "@refinedev/core";
import { MedplumClient } from "@medplum/core";
import { Resource, ResourceType, Bundle } from "@medplum/fhirtypes";
import { useState, useEffect, useCallback } from "react";
import { createLogger } from "../../../utils/logger";
import { medplumClient } from '@lib/medplum/client'
import { checkServerConnection } from "../../../lib/medplum/client";

// Initialize logger
const logger = createLogger('MedplumDataProvider');

/**
 * Creates a data provider that interfaces with Medplum FHIR server
 * Implements offline-first capabilities and error handling
 */
export const medplumDataProvider = (): DataProvider => ({
  getApiUrl: () => {
    return medplumClient.getBaseUrl() || '';
  },
  // Get a list of resources with pagination, sorting, and filtering
  getList: async ({ resource, pagination, filters, sorters, meta }) => {
    try {
      const isConnected = await checkServerConnection();

      if (!isConnected) {
        logger.warn(`Operating in offline mode for ${resource} list request`);
        // Return cached data if available
        // This would be implemented with IndexedDB or another offline storage solution
        const cachedData = localStorage.getItem(`medplum.${resource}.list`);
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          return {
            data: parsedData.data || [],
            total: parsedData.total || 0,
          };
        }
        return { data: [], total: 0 };
      }

      // Extract pagination parameters
      const { current = 1, pageSize = 10 } = pagination || {};

      // Build search parameters
      const searchParams: Record<string, string> = {
        _count: pageSize.toString(),
        _offset: ((current - 1) * pageSize).toString(),
      };

      // Add sorting if provided
      if (sorters && sorters.length > 0) {
        const sortParam = sorters
          .map((sorter) => `${sorter.order === "desc" ? "-" : ""}${sorter.field}`)
          .join(",");
        searchParams._sort = sortParam;
      }

      // Add filters if provided
      if (filters && filters.length > 0) {
        filters.forEach((filter) => {
          if (filter.operator === "eq") {
            searchParams[filter.field.toString()] = filter.value.toString();
          } else if (filter.operator === "contains") {
            searchParams[`${filter.field.toString()}:contains`] = filter.value.toString();
          }
          // Add more filter operators as needed
        });
      }

      // Execute the search
      const response = await medplumClient.search(resource as ResourceType, searchParams);

      // Cache the results for offline use
      localStorage.setItem(`medplum.${resource}.list`, JSON.stringify({
        data: response.entry?.map(e => e.resource) || [],
        total: response.total || 0,
      }));

      return {
        data: response.entry?.map((e: any) => e.resource) || [],
        total: response.total || 0,
      };
    } catch (error) {
      logger.error(`Error fetching ${resource} list:`, error);
      throw error;
    }
  },

  // Get a single resource by ID
  getOne: async <TData extends BaseRecord = BaseRecord>({ resource, id, meta }: GetOneParams): Promise<{ data: TData }> => {
    try {
      const isConnected = await checkServerConnection();

      if (!isConnected) {
        logger.warn(`Operating in offline mode for ${resource}/${id} request`);
        // Return cached data if available
        const cachedData = localStorage.getItem(`medplum.${resource}.${id}`);
        if (cachedData) {
          return { data: JSON.parse(cachedData) };
        }
        throw new Error(`Resource ${resource}/${id} not available offline`);
      }

      const response = await medplumClient.readResource(resource as ResourceType, String(id));

      // Cache the result for offline use
      localStorage.setItem(`medplum.${resource}.${String(id)}`, JSON.stringify(response));

      return {
        data: response as unknown as TData,
      };
    } catch (error) {
      logger.error(`Error fetching ${resource}/${id}:`, error);
      throw error;
    }
  },

  // Create a new resource
  create: async <TData extends BaseRecord = BaseRecord, TVariables = {}>({ resource, variables, meta }: CreateParams<TVariables>): Promise<CreateResponse<TData>> => {
    try {
      const isConnected = await checkServerConnection();

      if (!isConnected) {
        logger.warn(`Cannot create ${resource} while offline`);
        // Store the create request for later sync
        const pendingCreates = JSON.parse(localStorage.getItem(`medplum.pending.creates`) || '[]');
        pendingCreates.push({ resource, variables, timestamp: Date.now() });
        localStorage.setItem(`medplum.pending.creates`, JSON.stringify(pendingCreates));

        // Return a temporary ID for UI purposes
        const tempId = `temp-${Date.now()}`;
        return {
          data: {
            ...variables,
            id: tempId,
            _tempId: true,
          } as unknown as TData,
        };
      }

      // Ensure resource is a valid FHIR ResourceType
      const fhirResourceType = resource as ResourceType;

      // Create a properly typed resource object with the required resourceType
      // Use type assertion with unknown as intermediate step for type safety
      const resourceData = {
        resourceType: fhirResourceType,
        ...variables,
      };

      // First cast to unknown, then to Resource to satisfy TypeScript
      const response = await medplumClient.createResource(resourceData as unknown as Resource);

      // Cast the response to the expected TData type to satisfy TypeScript
      return {
        data: response as unknown as TData,
      };
    } catch (error) {
      logger.error(`Error creating ${resource}:`, error);
      throw error;
    }
  },

  // Update an existing resource
  update: async <TData extends BaseRecord = BaseRecord, TVariables = {}>({ resource, id, variables, meta }: UpdateParams<TVariables>): Promise<UpdateResponse<TData>> => {
    try {
      const isConnected = await checkServerConnection();

      if (!isConnected) {
        logger.warn(`Cannot update ${resource}/${id} while offline`);
        // Store the update request for later sync
        const pendingUpdates = JSON.parse(localStorage.getItem(`medplum.pending.updates`) || '[]');
        pendingUpdates.push({ resource, id, variables, timestamp: Date.now() });
        localStorage.setItem(`medplum.pending.updates`, JSON.stringify(pendingUpdates));

        // Update local cache for UI purposes
        const cachedData = localStorage.getItem(`medplum.${resource}.${id}`);
        if (cachedData) {
          const updatedData = { ...JSON.parse(cachedData), ...variables };
          localStorage.setItem(`medplum.${resource}.${id}`, JSON.stringify(updatedData));
          return { data: updatedData as unknown as TData };
        }

        throw new Error(`Resource ${resource}/${id} not available offline for update`);
      }

      // First, read the current resource
      const current = await medplumClient.readResource(resource as ResourceType, id as string);

      // Then update with new values
      const updated = { ...current, ...variables };

      // Send the update
      const response = await medplumClient.updateResource(updated);

      // Update the cache
      localStorage.setItem(`medplum.${resource}.${id}`, JSON.stringify(response));

      return {
        data: response as unknown as TData,
      };
    } catch (error) {
      logger.error(`Error updating ${resource}/${id}:`, error);
      throw error;
    }
  },

  // Delete a resource
  deleteOne: async <TData extends BaseRecord = BaseRecord, TVariables = {}>({ resource, id, meta }: DeleteOneParams<TVariables>) => {
    try {
      const isConnected = await checkServerConnection();

      if (!isConnected) {
        logger.warn(`Cannot delete ${resource}/${id} while offline`);
        // Store the delete request for later sync
        const pendingDeletes = JSON.parse(localStorage.getItem(`medplum.pending.deletes`) || '[]');
        pendingDeletes.push({ resource, id: String(id), timestamp: Date.now() });
        localStorage.setItem(`medplum.pending.deletes`, JSON.stringify(pendingDeletes));

        // Update local cache for UI purposes
        localStorage.removeItem(`medplum.${resource}.${String(id)}`);

        return { data: { id } } as DeleteOneResponse<TData>;
      }

      // FHIR doesn't truly delete resources, it marks them as deleted
      const current = await medplumClient.readResource(resource as ResourceType, String(id));

      // Create a properly typed update with the appropriate status for the resource type
      // Different FHIR resources have different allowed status values
      // We need to handle this dynamically based on the resource type
      let deleted: Resource;

      // Handle different resource types with appropriate status values
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

      const response = await medplumClient.updateResource(deleted);

      // Remove from cache
      localStorage.removeItem(`medplum.${resource}.${String(id)}`);

      return {
        data: { id },
      } as DeleteOneResponse<TData>;
    } catch (error) {
      logger.error(`Error deleting ${resource}/${id}:`, error);
      throw error;
    }
  },

  // Get many resources by their IDs
  getMany: async ({ resource, ids, meta }) => {
    try {
      const isConnected = await checkServerConnection();

      if (!isConnected) {
        logger.warn(`Operating in offline mode for ${resource} batch request`);
        // Return cached data if available
        const results = [];
        for (const id of ids) {
          const cachedData = localStorage.getItem(`medplum.${resource}.${id}`);
          if (cachedData) {
            results.push(JSON.parse(cachedData));
          }
        }

        if (results.length > 0) {
          return { data: results };
        }

        throw new Error(`Resources not available offline`);
      }

      // Use FHIR batch request for efficiency
      // Create a properly typed Bundle for batch operations
      const bundle: Bundle<Resource> = {
        resourceType: 'Bundle',
        type: 'batch',
        entry: ids.map(id => ({
          request: {
            method: 'GET',
            url: `${resource}/${id}`
          }
        }))
      };

      const response = await medplumClient.executeBatch(bundle);

      // Extract and cache results
      const results = response.entry?.map((entry: any) => {
        const resource = entry.resource;
        if (resource && resource.id) {
          localStorage.setItem(`medplum.${resource.resourceType}.${resource.id}`, JSON.stringify(resource));
        }
        return resource;
      }).filter(Boolean) || [];

      return {
        data: results,
      };
    } catch (error) {
      logger.error(`Error fetching multiple ${resource}:`, error);
      throw error;
    }
  },

  // Custom methods for FHIR-specific operations
  custom: async <TData extends BaseRecord = BaseRecord>({ url, method, filters, sorters, payload, query, headers, meta }: any): Promise<{ data: TData }> => {
    try {
      const isConnected = await checkServerConnection();

      if (!isConnected && method !== 'get') {
        logger.warn(`Cannot perform custom operation ${url} while offline`);
        throw new Error('Custom operations not available offline');
      }

      // For GET requests, check cache first
      if (method === 'get' && !isConnected) {
        const cacheKey = `medplum.custom.${url}`;
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          return { data: JSON.parse(cachedData) };
        }
        throw new Error(`Custom operation ${url} not available offline`);
      }

      // Perform the custom operation using the appropriate HTTP method
      let response;

      // Convert method to lowercase for comparison
      const methodLower = method.toLowerCase();

      if (methodLower === 'get') {
        response = await medplumClient.get(url, { headers: headers as Record<string, string> });
      } else if (methodLower === 'post') {
        response = await medplumClient.post(url, payload, 'application/json', { headers: headers as Record<string, string> });
      } else if (methodLower === 'put') {
        response = await medplumClient.put(url, payload, 'application/json', { headers: headers as Record<string, string> });
      } else if (methodLower === 'delete') {
        response = await medplumClient.delete(url, { headers: headers as Record<string, string> });
      } else if (methodLower === 'patch') {
        // For PATCH, we need to convert the payload to JSONPatch operations
        // This is a simplified approach - you might need to adjust based on your actual payload structure
        const operations = Array.isArray(payload) ? payload : [{ op: 'replace', path: '/', value: payload }];
        response = await medplumClient.patch(url, operations, { headers: headers as Record<string, string> });
      } else {
        throw new Error(`Unsupported HTTP method: ${method}`);
      }

      // Cache GET responses
      if (method === 'get') {
        const cacheKey = `medplum.custom.${url}`;
        localStorage.setItem(cacheKey, JSON.stringify(response));
      }

      return {
        data: response as unknown as TData,
      };
    } catch (error) {
      logger.error(`Error in custom operation ${url}:`, error);
      throw error;
    }
  },
});

export default medplumDataProvider;
