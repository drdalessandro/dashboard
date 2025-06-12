// src/lib/medplum/api-wrapper.ts
// Safe TypeScript wrapper for Medplum client API operations

import { Bundle, Resource, ResourceType } from '@medplum/fhirtypes';
import { MedplumRequestOptions } from '@medplum/core';
import medplumClient from './client';

/**
 * Type alias for Medplum search parameters
 * The Medplum search method expects a more flexible parameter structure
 */
type SearchParams = Record<string, string | string[] | number | boolean | undefined>;

/**
 * Type-safe wrapper for Medplum API operations
 * This ensures proper typing for all FHIR operations and prevents TypeScript errors
 */
export class MedplumApiWrapper {
  /**
   * Preprocesses any input data to ensure it's in the correct format for API operations
   * Handles strings, objects, and null values appropriately
   */
  private static preprocessBody(body: any): Record<string, any> {
    if (body === undefined || body === null) {
      return {};
    }
    
    if (typeof body === 'string') {
      try {
        // Try to parse it as JSON first
        return JSON.parse(body);
      } catch (e) {
        // If parsing fails, it might be an ID
        return { id: body };
      }
    }
    
    // If it's already an object, return as is
    return body;
  }

  /**
   * Safely read a resource by ID
   */
  static async readResource<T extends Resource>(resourceType: ResourceType, id: string, options?: MedplumRequestOptions): Promise<T> {
    // Call the medplum client method with proper type casting
    // The medplum client expects resourceType and id as separate parameters
    const result = await medplumClient.readResource(resourceType, id, options);
    return result as unknown as T;
  }

  /**
   * Search for resources with proper parameter handling
   */
  static async search<T extends Resource>(resourceType: ResourceType, params?: SearchParams, options?: MedplumRequestOptions): Promise<T[]> {
    // Convert our params to the format expected by Medplum
    const searchBundle = await medplumClient.search(resourceType, params as any, options);
    
    // Extract resources from the bundle entries
    const resources: T[] = [];
    
    if (searchBundle.entry && Array.isArray(searchBundle.entry)) {
      for (const entry of searchBundle.entry) {
        if (entry.resource) {
          resources.push(entry.resource as unknown as T);
        }
      }
    }
    
    return resources;
  }

  /**
   * Create a new resource
   */
  static async createResource<T extends Resource>(resourceType: ResourceType, body: any, options?: MedplumRequestOptions): Promise<T> {
    // Process the body data to ensure it's in the correct format
    const processedBody = this.preprocessBody(body);
    
    // Ensure the resourceType is correctly set
    const resource = {
      ...processedBody,
      resourceType
    } as Resource;
    
    // Create the resource and return the result with proper type casting
    const result = await medplumClient.createResource(resource, options);
    return result as unknown as T;
  }

  /**
   * Update an existing resource
   */
  static async updateResource<T extends Resource>(body: any, options?: MedplumRequestOptions): Promise<T> {
    // Process the body data to ensure it's in the correct format
    const processedBody = this.preprocessBody(body);
    
    // Ensure required fields are present
    if (!processedBody.id) {
      throw new Error('Resource ID is required for updates');
    }
    
    if (!processedBody.resourceType) {
      throw new Error('Resource type is required for updates');
    }
    
    // We need to make sure we're passing a proper Resource object to updateResource
    const resource = processedBody as Resource;
    const result = await medplumClient.updateResource(resource, options);
    return result as unknown as T;
  }

  /**
   * Delete a resource
   */
  static async deleteResource(resourceType: ResourceType, id: string): Promise<void> {
    return medplumClient.deleteResource(resourceType, id);
  }


}

export default MedplumApiWrapper;
