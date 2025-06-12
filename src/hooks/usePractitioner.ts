/**
 * usePractitioner.ts - Generated Hook
 * 
 * Auto-generated Practitioner hook using the resource factory
 * Replaces the existing usePractitioner with factory-generated version
 */

import { Practitioner } from '@medplum/fhirtypes';
import { createResourceHook } from './factory/createResourceHook';
import { ResourceConfigs } from './factory/ResourceConfig';

/**
 * Generated Practitioner hook with full FHIR support
 * 
 * This hook replaces the original 300+ line usePractitioner implementation
 * with a configuration-driven approach that provides the same functionality
 */
export const usePractitioner = createResourceHook<Practitioner>(
    ResourceConfigs.Practitioner,
    {
        // Enhanced error handling for practitioner operations
        onError: (error) => {
            // Custom error handling for practitioner-specific errors
            if (error.category === 'validation' && error.technicalMessage.includes('qualification')) {
                console.warn('Practitioner qualification validation failed:', error.userMessage);
            }
        },

        // Custom enhancement for practitioner specialties
        customEnhancements: [
            {
                name: 'specialtyInfo',
                compute: (practitioner: Practitioner) => ({
                    hasSpecialties: (practitioner.qualification?.length || 0) > 1,
                    primarySpecialty: practitioner.qualification?.[0]?.code?.text,
                    specialtyCount: practitioner.qualification?.length || 0,
                    certificationStatus: practitioner.qualification?.some(q =>
                        q.period?.end && new Date(q.period.end) > new Date()
                    ) ? 'current' : 'expired',
                }),
                dependencies: ['qualification'],
                memoize: true
            }
        ]
    }
);

/**
 * Example of a customized practitioner hook with specific requirements
 */
export const usePractitionerWithCustomValidation = createResourceHook<Practitioner>(
    {
        ...ResourceConfigs.Practitioner,
        validation: {
            required: ['name', 'gender'],
            custom: (practitioner: Practitioner) => {
                if (!practitioner.name?.[0]?.family && !practitioner.name?.[0]?.given?.[0]) {
                    return 'Practitioner must have at least a family name or given name';
                }
                return null;
            }
        }
    },
    {
        // Custom enhancement for practitioner specialties
        customEnhancements: [
            {
                name: 'specialtyInfo',
                compute: (practitioner: Practitioner) => ({
                    hasSpecialties: (practitioner.qualification?.length || 0) > 1,
                    primarySpecialty: practitioner.qualification?.[0]?.code?.text,
                    specialtyCount: practitioner.qualification?.length || 0,
                    certificationStatus: practitioner.qualification?.some(q =>
                        q.period?.end && new Date(q.period.end) > new Date()
                    ) ? 'current' : 'expired',
                }),
                dependencies: ['qualification'],
                memoize: true
            }
        ]
    }
);


/**
 * Specialized hook for practitioner search scenarios
 */
export const usePractitionerSearch = createResourceHook<Practitioner>(
    {
        ...ResourceConfigs.Practitioner,
        features: {
            ...ResourceConfigs.Practitioner.features,
            enablePagination: true,
            enableSearch: true,
            enableEnhancement: false // Disable for search performance
        },
        state: {
            initialPageSize: 20, // Larger page size for search
            enablePagination: true,
            enableFilters: true,
            enableSearch: true
        }
    },
    {
        disableEnhancement: true // Focus on search performance
    }
);

export default usePractitioner;