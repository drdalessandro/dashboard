/**
 * debugResourceData.ts
 * Utility to help debug resource data issues
 */

import { createLogger } from '../utils/logger';
import { Resource } from '@medplum/fhirtypes';

// Initialize logger for this module
const logger = createLogger('debugResourceData');

/**
 * A utility function to debug the data structure returned by resource hooks
 */
export function debugResourceData(
  prefix: string,
  data: any,
  id?: string
): void {
  try {
    // Create a sanitized version for logging (avoid circular references)
    const logData: any = {
      type: typeof data,
      isNull: data === null,
      isUndefined: data === undefined,
      isArray: Array.isArray(data)
    };

    if (data === null || data === undefined) {
      logger.warn(`${prefix} - Data is ${data === null ? 'null' : 'undefined'}`);
      return;
    }

    // Add resource-specific data
    if (typeof data === 'object') {
      logData.keysLength = Object.keys(data).length;
      logData.hasResourceType = 'resourceType' in data;
      
      if ('resourceType' in data) {
        logData.resourceType = data.resourceType;
        logData.id = data.id;
      }

      // Handle arrays
      if (Array.isArray(data)) {
        logData.arrayLength = data.length;
        
        if (data.length > 0) {
          logData.firstItemType = typeof data[0];
          if (typeof data[0] === 'object' && data[0] !== null) {
            logData.firstItemResourceType = (data[0] as any).resourceType;
            logData.firstItemId = (data[0] as any).id;
          }
        }
      }

      // Handle Bundle structure
      if ('resourceType' in data && data.resourceType === 'Bundle') {
        logData.bundleType = data.type;
        logData.entryCount = data.entry?.length || 0;
        
        if (data.entry?.length > 0) {
          logData.firstEntryHasResource = !!data.entry[0].resource;
          if (data.entry[0].resource) {
            logData.firstEntryResourceType = data.entry[0].resource.resourceType;
            logData.firstEntryResourceId = data.entry[0].resource.id;
          }
        }
      }
    }

    // Add the requested ID if provided
    if (id) {
      logData.requestedId = id;
      
      // Check if the ID matches any resource in the data
      if (typeof data === 'object' && data !== null) {
        if ('id' in data && data.id === id) {
          logData.idMatch = true;
        } else if (Array.isArray(data)) {
          const matchingItem = data.find((item: any) => 
            item && typeof item === 'object' && 'id' in item && item.id === id
          );
          logData.idMatchInArray = !!matchingItem;
        } else if ('resourceType' in data && data.resourceType === 'Bundle' && data.entry) {
          const matchingEntry = data.entry.find((entry: any) => 
            entry.resource && entry.resource.id === id
          );
          logData.idMatchInBundle = !!matchingEntry;
        }
      }
    }

    logger.debug(`${prefix} - Resource data debug:`, logData);
  } catch (error) {
    logger.error(`Error in debugResourceData: ${error}`);
  }
}

/**
 * Check if a resource is valid
 */
export function isValidResource(data: any): data is Resource {
  return (
    data !== null &&
    typeof data === 'object' &&
    'resourceType' in data &&
    typeof data.resourceType === 'string' &&
    'id' in data &&
    typeof data.id === 'string'
  );
}

/**
 * Extract a single resource from various data structures
 */
export function extractResource<T extends Resource>(
  data: any,
  resourceType: string,
  id?: string
): T | null {
  if (!data) {
    return null;
  }

  // Case 1: Data is already the resource we want
  if (
    isValidResource(data) &&
    data.resourceType === resourceType &&
    (!id || data.id === id)
  ) {
    return data as T;
  }

  // Case 2: Data is an array of resources
  if (Array.isArray(data)) {
    const resource = data.find(
      (item) =>
        isValidResource(item) &&
        item.resourceType === resourceType &&
        (!id || item.id === id)
    );
    return (resource as T) || null;
  }

  // Case 3: Data is a Bundle
  if (
    typeof data === 'object' &&
    data.resourceType === 'Bundle' &&
    Array.isArray(data.entry)
  ) {
    const entry = data.entry.find(
      (entry: any) =>
        entry.resource &&
        entry.resource.resourceType === resourceType &&
        (!id || entry.resource.id === id)
    );
    return (entry?.resource as T) || null;
  }

  return null;
}
