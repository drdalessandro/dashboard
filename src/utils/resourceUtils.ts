/**
 * resourceUtils.ts
 * Utilities for handling FHIR resources and identifiers
 */
import { createLogger } from './logger';

const logger = createLogger('resourceUtils');

/**
 * Valid UUID formats
 * 1. Standard: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (8-4-4-4-12)
 * 2. Non-standard: xxxxxxxx-xxxx-xxxx-xxxxxxxxxxxxxxxx (8-4-4-16)
 * 3. Integer strings (when parsed as UUIDs)
 */

/**
 * Check if a string is a valid UUID
 * @param id String to validate
 * @returns Boolean indicating if the ID is a valid UUID
 */
export function isValidUuid(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  
  // Standard UUID format (8-4-4-4-12)
  const standardUuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (standardUuidPattern.test(id)) return true;
  
  // Non-standard format (8-4-4-16) sometimes used in FHIR systems
  const nonStandardUuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{16}$/i;
  if (nonStandardUuidPattern.test(id)) return true;
  
  // Also allow integer string IDs (for non-UUID FHIR systems)
  const integerPattern = /^\d+$/;
  if (integerPattern.test(id)) return true;
  
  return false;
}

/**
 * Attempt to normalize various ID formats to a standard form
 * @param id Original ID string
 * @returns Normalized ID string
 */
export function normalizeResourceId(id: string): string {
  if (!id) return id;
  
  try {
    // Remove any whitespace
    const trimmedId = id.trim();
    
    // If it's already a valid UUID, return as is
    if (isValidUuid(trimmedId)) {
      return trimmedId;
    }
    
    // Attempt to correct common issues:
    
    // 1. IDs with spaces or other separators
    const noSpacesId = trimmedId.replace(/\s+/g, '');
    if (isValidUuid(noSpacesId)) {
      logger.debug(`Normalized ID by removing spaces: ${id} -> ${noSpacesId}`);
      return noSpacesId;
    }
    
    // 2. IDs that are missing dashes where they should be
    if (trimmedId.length === 32 && !trimmedId.includes('-')) {
      const withDashes = [
        trimmedId.substring(0, 8),
        trimmedId.substring(8, 12),
        trimmedId.substring(12, 16),
        trimmedId.substring(16, 20),
        trimmedId.substring(20)
      ].join('-');
      
      if (isValidUuid(withDashes)) {
        logger.debug(`Normalized ID by adding dashes: ${id} -> ${withDashes}`);
        return withDashes;
      }
    }
    
    // 3. Try lowercase
    const lowerCaseId = trimmedId.toLowerCase();
    if (lowerCaseId !== trimmedId && isValidUuid(lowerCaseId)) {
      logger.debug(`Normalized ID to lowercase: ${id} -> ${lowerCaseId}`);
      return lowerCaseId;
    }
    
    // If none of our normalization attempts worked, return the original
    logger.warn(`Could not normalize ID: ${id}`);
    return trimmedId;
  } catch (error) {
    logger.error(`Error normalizing ID: ${id}`, error);
    return id; // Return original on error
  }
}

/**
 * Validate a resource ID, throwing an error if invalid
 * @param id ID to validate
 * @throws Error if ID is invalid
 */
export function validateResourceId(id: string | undefined | null): void {
  if (!id) {
    throw new Error('Resource ID is required');
  }
  
  if (typeof id !== 'string') {
    throw new Error(`Resource ID must be a string, got ${typeof id}`);
  }
  
  if (id.trim() === '') {
    throw new Error('Resource ID cannot be empty');
  }
  
  // Additional validation could be added here
}

/**
 * Safe wrapper for resource ID operations
 * @param id The ID to process
 * @param operation Function to apply to the ID
 * @returns Result of the operation or null if an error occurred
 */
export function safeResourceIdOperation<T>(
  id: string | undefined | null,
  operation: (normalizedId: string) => T
): T | null {
  try {
    if (!id) {
      logger.warn('Attempted to process a null or undefined resource ID');
      return null;
    }
    
    const normalizedId = normalizeResourceId(id);
    return operation(normalizedId);
  } catch (error) {
    logger.error(`Error processing resource ID: ${id}`, error);
    return null;
  }
}
