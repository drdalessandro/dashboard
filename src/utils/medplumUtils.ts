/**
 * medplumUtils.ts
 * Utility functions for working with Medplum FHIR client
 */
import { ResourceType, Resource } from '@medplum/fhirtypes';
import { medplumClient } from '../lib/medplum/client';
import { createLogger } from './logger';
import { normalizeResourceId, isValidUuid } from './resourceUtils';

const logger = createLogger('medplumUtils');

/**
 * Wrapper for fetching resources that handles problematic ID formats
 * This maintains compatibility with Medplum types by using the original client
 * methods but adds additional error handling and retry logic for specific cases
 */
export async function fetchResourceSafely<T extends Resource>(
  resourceType: ResourceType,
  id: string,
  options?: { fallbackToNormalizedId?: boolean }
): Promise<T | null> {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    logger.error(`Invalid resource ID: ${String(id)}`);
    return null;
  }

  const opts = {
    fallbackToNormalizedId: true,
    ...options
  };

  try {
    // Try original ID first
    return await medplumClient.readResource(resourceType, id);
  } catch (originalError) {
    logger.warn(`Error fetching ${resourceType}/${id}:`, originalError);

    // Check if this is the known problematic ID
    if (id === '01955638-e505-76c9-8818-47d1a48b77b1') {
      logger.warn(`Detected known problematic ID: ${id}`);
    }

    // Only try alternative formats if enabled
    if (opts.fallbackToNormalizedId) {
      try {
        // Normalize ID (remove spaces, handle case, etc.)
        const normalizedId = normalizeResourceId(id);
        
        if (normalizedId !== id) {
          logger.debug(`Trying normalized ID: ${normalizedId}`);
          return await medplumClient.readResource(resourceType, normalizedId);
        }
      } catch (normalizedError) {
        logger.error(`Failed with normalized ID as well:`, normalizedError);
      }

      // Try without dashes if ID contains dashes
      if (id.includes('-')) {
        try {
          const noDashesId = id.replace(/-/g, '');
          logger.debug(`Trying ID without dashes: ${noDashesId}`);
          return await medplumClient.readResource(resourceType, noDashesId);
        } catch (noDashesError) {
          logger.error(`Failed with no-dashes ID as well:`, noDashesError);
        }
      }
    }

    // All attempts failed
    return null;
  }
}

/**
 * Check if a Patient ID exists in the system
 * This is a lightweight check that doesn't fetch the full resource
 */
export async function doesPatientExist(id: string): Promise<boolean> {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    return false;
  }

  try {
    // Use search with _id parameter which is more efficient than fetching the whole resource
    const results = await medplumClient.search('Patient', { _id: id, _count: 1 });
    return results.length > 0;
  } catch (error) {
    logger.error(`Error checking if patient ${id} exists:`, error);
    return false;
  }
}

/**
 * Get diagnostic information about a patient ID
 */
export function getPatientIdDiagnostics(id: string): { 
  isValid: boolean;
  isValidFormat: boolean;
  isKnownProblematic: boolean;
  normalizedId: string;
  diagnosticMessage: string;
} {
  const normalizedId = normalizeResourceId(id);
  const isValid = !!id && typeof id === 'string' && id.trim() !== '';
  const isValidFormat = isValidUuid(normalizedId);
  const isKnownProblematic = id === '01955638-e505-76c9-8818-47d1a48b77b1';
  
  let diagnosticMessage = '';
  
  if (!isValid) {
    diagnosticMessage = 'Invalid ID: Empty or null value';
  } else if (!isValidFormat) {
    diagnosticMessage = 'ID format may be invalid: Does not match expected patterns';
  } else if (isKnownProblematic) {
    diagnosticMessage = 'This is a known problematic ID. Try accessing a different patient record.';
  } else if (normalizedId !== id) {
    diagnosticMessage = `ID normalized from "${id}" to "${normalizedId}"`;
  }
  
  return {
    isValid,
    isValidFormat,
    isKnownProblematic,
    normalizedId,
    diagnosticMessage
  };
}
