/**
 * useResourceEnhancement.ts
 * 
 * Generic enhancement patterns for FHIR resources with computed properties
 * Eliminates duplication between Patient/Practitioner enhancement logic
 * Provides configurable enhancement strategies for different resource types
 */

import React from 'react';
import { Resource, ResourceType, Patient, Practitioner } from '@medplum/fhirtypes';
import { calculateAge } from '@medplum/core';
import { formatHumanName, formatGender } from '../../utils/fhir/resourceUtils';
import { createLogger } from '../../utils/logger';

// Initialize logger
const logger = createLogger('useResourceEnhancement');

export interface ComputedProperties {
  [key: string]: any;
}

export interface EnhancementStrategy<T extends Resource = Resource> {
  name: string;
  compute: (resource: T) => ComputedProperties;
  dependencies?: (keyof T)[];
  memoize?: boolean;
}

export interface ResourceEnhancementOptions<T extends Resource = Resource> {
  resourceType: ResourceType;
  strategies: EnhancementStrategy<T>[];
  enableMemoization?: boolean;
  onEnhancementError?: (error: Error, resource: T, strategy: string) => void;
}

export type EnhancedResource<T extends Resource = Resource> = T & {
  _computed?: ComputedProperties;
  _enhancementId?: string;
  _lastEnhanced?: number;
}

/**
 * Hook for enhancing FHIR resources with computed properties
 */
export function useResourceEnhancement<T extends Resource = Resource>(
  options: ResourceEnhancementOptions<T>
) {
  const {
    resourceType,
    strategies,
    enableMemoization = true,
    onEnhancementError,
  } = options;

  // Memoization cache for enhanced resources
  const enhancementCache = React.useRef<Map<string, EnhancedResource<T>>>(new Map());

  /**
   * Generate cache key for resource
   */
  const getCacheKey = React.useCallback((resource: T): string => {
    const baseKey = `${resource.resourceType}-${resource.id}`;
    const versionKey = resource.meta?.versionId || '1';
    const lastModified = resource.meta?.lastUpdated || '';
    return `${baseKey}-${versionKey}-${lastModified}`;
  }, []);

  /**
   * Check if resource dependencies have changed
   */
  const hasDependenciesChanged = React.useCallback((
    resource: T,
    strategy: EnhancementStrategy<T>,
    cachedResource?: EnhancedResource<T>
  ): boolean => {
    if (!cachedResource || !strategy.dependencies) return true;

    return strategy.dependencies.some(dep => {
      const currentValue = resource[dep];
      const cachedValue = cachedResource[dep as keyof EnhancedResource<T>];
      return JSON.stringify(currentValue) !== JSON.stringify(cachedValue);
    });
  }, []);

  /**
   * Apply a single enhancement strategy to a resource
   */
  const applyStrategy = React.useCallback((
    resource: T,
    strategy: EnhancementStrategy<T>,
    existingComputed: ComputedProperties = {}
  ): ComputedProperties => {
    try {
      logger.debug(`Applying enhancement strategy: ${strategy.name}`);

      const computed = strategy.compute(resource);
      return { ...existingComputed, ...computed };
    } catch (error) {
      const enhancementError = error instanceof Error ? error : new Error(String(error));
      logger.error(`Enhancement strategy '${strategy.name}' failed:`, enhancementError);

      if (onEnhancementError) {
        onEnhancementError(enhancementError, resource, strategy.name);
      }

      return existingComputed;
    }
  }, [onEnhancementError]);

  /**
   * Enhance a single resource with all strategies
   */
  const enhanceResource = React.useCallback((resource: T): EnhancedResource<T> => {
    if (!resource) return resource as EnhancedResource<T>;

    const cacheKey = getCacheKey(resource);

    // Check memoization cache
    if (enableMemoization && enhancementCache.current.has(cacheKey)) {
      const cached = enhancementCache.current.get(cacheKey)!;

      // Check if any strategy dependencies have changed
      const hasChanges = strategies.some(strategy =>
        hasDependenciesChanged(resource, strategy, cached)
      );

      if (!hasChanges) {
        logger.debug(`Using cached enhancement for ${cacheKey}`);
        return cached;
      }
    }

    logger.debug(`Enhancing resource: ${resourceType}/${resource.id}`);

    // Apply all enhancement strategies
    let computedProperties: ComputedProperties = {};

    for (const strategy of strategies) {
      computedProperties = applyStrategy(resource, strategy, computedProperties);
    }

    // Create enhanced resource
    const enhanced: EnhancedResource<T> = {
      ...resource,
      _computed: computedProperties,
      _enhancementId: cacheKey,
      _lastEnhanced: Date.now()
    };

    // Cache the result
    if (enableMemoization) {
      enhancementCache.current.set(cacheKey, enhanced);

      // Limit cache size
      if (enhancementCache.current.size > 100) {
        const oldestKey = enhancementCache.current.keys().next().value;
        if (oldestKey) {
          enhancementCache.current.delete(oldestKey);
        }
      }
    }

    return enhanced;
  }, [resourceType, strategies, enableMemoization, getCacheKey, hasDependenciesChanged, applyStrategy]);

  /**
   * Enhance multiple resources
   */
  const enhanceResources = React.useCallback((resources: T[]): EnhancedResource<T>[] => {
    return resources.map(enhanceResource);
  }, [enhanceResource]);

  /**
   * Get computed property safely from enhanced resource
   */
  const getComputedProperty = React.useCallback(<K extends keyof ComputedProperties>(
    resource: EnhancedResource<T>,
    property: K
  ): ComputedProperties[K] | undefined => {
    return resource._computed?.[property];
  }, []);

  /**
   * Clear enhancement cache
   */
  const clearCache = React.useCallback((): void => {
    enhancementCache.current.clear();
    logger.debug('Enhancement cache cleared');
  }, []);

  /**
   * Get cache statistics
   */
  const getCacheStats = React.useCallback(() => {
    return {
      size: enhancementCache.current.size,
      maxSize: 100,
      hitRatio: 0 // Could implement hit tracking if needed
    };
  }, []);

  return {
    enhanceResource,
    enhanceResources,
    getComputedProperty,
    clearCache,
    getCacheStats
  };
}

/**
 * Common enhancement strategies for different resource types
 */
export const CommonEnhancementStrategies = {
  /**
   * Patient enhancement strategies
   */
  Patient: {
    basicInfo: {
      name: 'basicInfo',
      compute: (patient: Patient) => ({
        formattedName: formatHumanName(patient.name, 'official') || 'Unknown',
        gender: formatGender(patient.gender),
        age: patient.birthDate ? Number(calculateAge(patient.birthDate)) : undefined,
      }),
      dependencies: ['name', 'gender', 'birthDate'],
      memoize: true
    } as EnhancementStrategy<Patient>,

    contactInfo: {
      name: 'contactInfo',
      compute: (patient: Patient) => ({
        contactInfo: patient.telecom?.[0]?.value || 'N/A',
        primaryPhone: patient.telecom?.find(t => t.system === 'phone')?.value,
        primaryEmail: patient.telecom?.find(t => t.system === 'email')?.value,
      }),
      dependencies: ['telecom'],
      memoize: true
    } as EnhancementStrategy<Patient>,

    addressInfo: {
      name: 'addressInfo',
      compute: (patient: Patient) => ({
        address: patient.address?.[0]?.text || patient.address?.[0]?.line?.join(', ') || 'N/A',
        city: patient.address?.[0]?.city,
        country: patient.address?.[0]?.country,
      }),
      dependencies: ['address'],
      memoize: true
    } as EnhancementStrategy<Patient>,

    communication: {
      name: 'communication',
      compute: (patient: Patient) => ({
        communication: patient.communication?.[0]?.language?.text ||
          patient.communication?.[0]?.language?.coding?.[0]?.display || 'N/A',
        preferredLanguage: patient.communication?.find(c => c.preferred)?.language?.text,
      }),
      dependencies: ['communication'],
      memoize: true
    } as EnhancementStrategy<Patient>
  },

  /**
   * Practitioner enhancement strategies
   */
  Practitioner: {
    basicInfo: {
      name: 'basicInfo',
      compute: (practitioner: Practitioner) => ({
        status: practitioner.active !== false,
        formattedName: formatHumanName(practitioner.name, 'official') || 'Unknown',
        gender: formatGender(practitioner.gender),
      }),
      dependencies: ['name', 'gender'],
      memoize: true
    } as EnhancementStrategy<Practitioner>,

    qualification: {
      name: 'qualification',
      compute: (practitioner: Practitioner) => ({
        qualification: practitioner.qualification?.[0]?.code?.text ||
          practitioner.qualification?.[0]?.code?.coding?.[0]?.display || 'General',
        qualifications: practitioner.qualification?.map(q =>
          q.code?.text || q.code?.coding?.[0]?.display
        ).filter(Boolean),
      }),
      dependencies: ['qualification'],
      memoize: true
    } as EnhancementStrategy<Practitioner>,

    contactInfo: {
      name: 'contactInfo',
      compute: (practitioner: Practitioner) => ({
        contactInfo: practitioner.telecom?.[0]?.value || 'N/A',
        primaryPhone: practitioner.telecom?.find(t => t.system === 'phone')?.value,
        primaryEmail: practitioner.telecom?.find(t => t.system === 'email')?.value,
      }),
      dependencies: ['telecom'],
      memoize: true
    } as EnhancementStrategy<Practitioner>,

    addressInfo: {
      name: 'addressInfo',
      compute: (practitioner: Practitioner) => ({
        address: practitioner.address?.[0]?.text || practitioner.address?.[0]?.line?.join(', ') || 'N/A',
        city: practitioner.address?.[0]?.city,
        country: practitioner.address?.[0]?.country,
      }),
      dependencies: ['address'],
      memoize: true
    } as EnhancementStrategy<Practitioner>,

    communication: {
      name: 'communication',
      compute: (practitioner: Practitioner) => ({
        communication: practitioner.communication?.[0]?.text ||
          practitioner.communication?.[0]?.coding?.[0]?.display || 'N/A',
      }),
      dependencies: ['communication'],
      memoize: true
    } as EnhancementStrategy<Practitioner>
  }
};

/**
 * Convenience hook for Patient enhancement
 */
export function usePatientEnhancement() {
  return useResourceEnhancement<Patient>({
    resourceType: 'Patient',
    strategies: [
      CommonEnhancementStrategies.Patient.basicInfo,
      CommonEnhancementStrategies.Patient.contactInfo,
      CommonEnhancementStrategies.Patient.addressInfo,
      CommonEnhancementStrategies.Patient.communication,
    ]
  });
}

/**
 * Convenience hook for Practitioner enhancement
 */
export function usePractitionerEnhancement() {
  return useResourceEnhancement<Practitioner>({
    resourceType: 'Practitioner',
    strategies: [
      CommonEnhancementStrategies.Practitioner.basicInfo,
      CommonEnhancementStrategies.Practitioner.qualification,
      CommonEnhancementStrategies.Practitioner.contactInfo,
      CommonEnhancementStrategies.Practitioner.addressInfo,
      CommonEnhancementStrategies.Practitioner.communication,
    ]
  });
}

/**
 * Type-safe helper to get computed properties
 */
export function getResourceComputedProperty<
  T extends Resource,
  K extends keyof ComputedProperties
>(
  resource: EnhancedResource<T>,
  property: K
): ComputedProperties[K] | undefined {
  return resource._computed?.[property];
}

/**
 * Create custom enhancement strategy
 */
export function createEnhancementStrategy<T extends Resource>(
  name: string,
  computeFn: (resource: T) => ComputedProperties,
  options: {
    dependencies?: (keyof T)[];
    memoize?: boolean;
  } = {}
): EnhancementStrategy<T> {
  return {
    name,
    compute: computeFn,
    dependencies: options.dependencies,
    memoize: options.memoize ?? true
  };
}
