/**
 * usePatient.ts - Generated Hook
 * 
 * Auto-generated Patient hook using the resource factory
 * Demonstrates how the factory creates fully-featured hooks with minimal code
 */

import { Patient } from '@medplum/fhirtypes';
import { createResourceHook } from './factory/createResourceHook';
import { ResourceConfigs } from './factory/ResourceConfig';

/**
 * Generated Patient hook with full FHIR support
 * 
 * Features included:
 * - Full CRUD operations (create, read, update, delete)
 * - Offline support with automatic sync
 * - Enhanced data with computed properties
 * - Caching with automatic cleanup
 * - Pagination and filtering
 * - Comprehensive error handling
 * - Type-safe operations
 */
export const usePatient = createResourceHook<Patient>(
  ResourceConfigs.Patient,
  {
    // Optional customizations can be added here
    onDataChange: (data) => {
      console.log('Patient data changed:', data);
    },
    onError: (error) => {
      console.error('Patient operation error:', error.userMessage);
    }
  }
);

/**
 * Example of a customized Patient hook with specific requirements
 */
export const usePatientWithCustomValidation = createResourceHook<Patient>(
  {
    ...ResourceConfigs.Patient,
    validation: {
      required: ['name', 'gender'],
      custom: (patient: Patient) => {
        if (!patient.birthDate) {
          return 'Birth date is required for proper age calculation';
        }
        if (!patient.telecom?.length) {
          return 'At least one contact method is required';
        }
        return null;
      }
    }
  },
  {
    // Custom enhancement to add age validation
    customEnhancements: [
      {
        name: 'ageValidation',
        compute: (patient: Patient) => {
          if (patient.birthDate) {
            const age = new Date().getFullYear() - new Date(patient.birthDate).getFullYear();
            return {
              ageCategory: age < 18 ? 'minor' : age > 65 ? 'senior' : 'adult',
              requiresGuardianConsent: age < 18,
              qualifiesForSeniorDiscount: age >= 65
            };
          }
          return {};
        },
        dependencies: ['birthDate'],
        memoize: true
      }
    ]
  }
);

/**
 * Specialized hook for patient search scenarios
 */
export const usePatientSearch = createResourceHook<Patient>(
  {
    ...ResourceConfigs.Patient,
    features: {
      ...ResourceConfigs.Patient.features,
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
  }
);

/**
 * Simplified Patient hook for basic use cases
 */
export const useSimplePatient = createResourceHook<Patient>(
  {
    resourceType: 'Patient',
    features: {
      enableCRUD: true,
      enableCaching: true,
      enableEnhancement: false, // Disable enhancement for simple use case
      enablePagination: false,
      enableSearch: false,
      enableOffline: true,
      enableOptimisticUpdates: false
    }
  }
);

export default usePatient;