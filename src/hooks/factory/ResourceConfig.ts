/**
 * ResourceConfig.ts
 * 
 * Configuration interfaces for the resource hook factory
 * Defines how different FHIR resource types should be configured
 * for automatic hook generation
 */

import {
  Resource,
  ResourceType,
  Patient,
  Practitioner,
  Observation,
  MedicationRequest,
  Condition,
  AllergyIntolerance,
  Immunization,
  Encounter,
  Organization,
  PractitionerRole,
  CareTeam
} from '@medplum/fhirtypes';
import type {
  BaseCRUDOptions,
  ResourceCacheOptions,
  ResourceEnhancementOptions,
  BaseStateOptions,
  EnhancementStrategy
} from '../base';

/**
 * Configuration for a resource hook factory
 */
export interface ResourceHookConfig<T extends Resource = Resource> {
  // Basic configuration
  resourceType: ResourceType;
  displayName?: string;
  description?: string;

  // Feature flags
  features: {
    enableCRUD?: boolean;
    enableCaching?: boolean;
    enableEnhancement?: boolean;
    enablePagination?: boolean;
    enableSearch?: boolean;
    enableOffline?: boolean;
    enableOptimisticUpdates?: boolean;
  };

  // Hook-specific configurations
  crud?: Partial<BaseCRUDOptions<T>>;
  cache?: Partial<ResourceCacheOptions>;
  enhancement?: Partial<ResourceEnhancementOptions<T>>;
  state?: Partial<BaseStateOptions>;

  // Custom hook implementations
  customHooks?: {
    [hookName: string]: () => any;
  };

  // Validation rules
  validation?: {
    required?: (keyof T)[];
    custom?: (resource: T) => string | null;
  };

  // Search configuration
  search?: {
    searchableFields?: string[];
    defaultSort?: { field: string; order: 'asc' | 'desc' };
    filters?: Array<{
      key: string;
      label: string;
      type: 'text' | 'select' | 'date' | 'boolean';
      options?: Array<{ value: any; label: string }>;
    }>;
  };
}

/**
 * Pre-built configurations for common FHIR resources
 */
export const ResourceConfigs = {
  Patient: {
    resourceType: 'Patient' as const,
    displayName: 'Patient',
    description: 'Individual receiving healthcare services',
    features: {
      enableCRUD: true,
      enableCaching: true,
      enableEnhancement: true,
      enablePagination: true,
      enableSearch: true,
      enableOffline: true,
      enableOptimisticUpdates: true,
    },
    crud: {
      enableOffline: true,
      enableCache: true,
      cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
    },
    cache: {
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      enableAutoCleanup: true,
      maxCacheSize: 100,
    },
    state: {
      initialPageSize: 10,
      enablePagination: true,
      enableFilters: true,
      enableSearch: true,
    },
    search: {
      searchableFields: ['name', 'identifier', 'telecom'],
      defaultSort: { field: 'name', order: 'asc' as const },
      filters: [
        {
          key: 'gender',
          label: 'Gender',
          type: 'select' as const,
          options: [
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'other', label: 'Other' },
          ],
        },
        {
          key: 'active',
          label: 'Active',
          type: 'boolean' as const,
        },
        {
          key: 'birthDate',
          label: 'Birth Date',
          type: 'date' as const,
        },
      ],
    },
    validation: {
      required: ['name'],
      custom: (patient: Patient) => {
        if (!patient.name?.[0]?.family && !patient.name?.[0]?.given?.[0]) {
          return 'Patient must have at least a family name or given name';
        }
        return null;
      },
    },
  } as ResourceHookConfig<Patient>,

  Practitioner: {
    resourceType: 'Practitioner' as const,
    displayName: 'Practitioner',
    description: 'Healthcare professional providing care',
    features: {
      enableCRUD: true,
      enableCaching: true,
      enableEnhancement: true,
      enablePagination: true,
      enableSearch: true,
      enableOffline: true,
      enableOptimisticUpdates: true,
    },
    crud: {
      enableOffline: true,
      enableCache: true,
      cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
    },
    cache: {
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      enableAutoCleanup: true,
      maxCacheSize: 50, // Fewer practitioners than patients typically
    },
    state: {
      initialPageSize: 10,
      enablePagination: true,
      enableFilters: true,
      enableSearch: true,
    },
    search: {
      searchableFields: ['name', 'qualification', 'telecom'],
      defaultSort: { field: 'name', order: 'asc' as const },
      filters: [
        {
          key: 'active',
          label: 'Active',
          type: 'boolean' as const,
        },
        {
          key: 'qualification',
          label: 'Qualification',
          type: 'text' as const,
        },
      ],
    },
    validation: {
      required: ['name'],
      custom: (practitioner: Practitioner) => {
        if (!practitioner.name?.[0]?.family && !practitioner.name?.[0]?.given?.[0]) {
          return 'Practitioner must have at least a family name or given name';
        }
        return null;
      },
    },
  } as ResourceHookConfig<Practitioner>,

  PractitionerRole: {
    resourceType: 'PractitionerRole',
    features: {
      enableCRUD: true,
      enableCaching: true,
      enableEnhancement: false,
      enablePagination: true,
      enableSearch: true,
      enableOffline: true,
      enableOptimisticUpdates: false
    }
  } as ResourceHookConfig<PractitionerRole>,

  Observation: {
    resourceType: 'Observation' as const,
    displayName: 'Observation',
    description: 'Clinical observation or measurement',
    features: {
      enableCRUD: true,
      enableCaching: true,
      enableEnhancement: false, // Observations are more data-focused
      enablePagination: true,
      enableSearch: true,
      enableOffline: true,
      enableOptimisticUpdates: false, // Clinical data should be more cautious
    },
    crud: {
      enableOffline: true,
      enableCache: true,
      cacheTTL: 12 * 60 * 60 * 1000, // 12 hours (shorter for clinical data)
    },
    cache: {
      ttl: 12 * 60 * 60 * 1000, // 12 hours
      enableAutoCleanup: true,
      maxCacheSize: 200, // More observations than people
    },
    state: {
      initialPageSize: 20,
      enablePagination: true,
      enableFilters: true,
      enableSearch: true,
    },
    search: {
      searchableFields: ['code', 'subject', 'performer'],
      defaultSort: { field: 'effectiveDateTime', order: 'desc' as const },
      filters: [
        {
          key: 'status',
          label: 'Status',
          type: 'select' as const,
          options: [
            { value: 'registered', label: 'Registered' },
            { value: 'preliminary', label: 'Preliminary' },
            { value: 'final', label: 'Final' },
            { value: 'amended', label: 'Amended' },
          ],
        },
        {
          key: 'category',
          label: 'Category',
          type: 'text' as const,
        },
      ],
    },
    validation: {
      required: ['status', 'code', 'subject'],
    },
  } as ResourceHookConfig<Observation>,

  MedicationRequest: {
    resourceType: 'MedicationRequest' as const,
    displayName: 'Medication Request',
    description: 'Prescription or medication order',
    features: {
      enableCRUD: true,
      enableCaching: true,
      enableEnhancement: true,
      enablePagination: true,
      enableSearch: true,
      enableOffline: true,
      enableOptimisticUpdates: false, // Prescriptions should be handled carefully
    },
    crud: {
      enableOffline: true,
      enableCache: true,
      cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
    },
    cache: {
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      enableAutoCleanup: true,
      maxCacheSize: 150,
    },
    state: {
      initialPageSize: 15,
      enablePagination: true,
      enableFilters: true,
      enableSearch: true,
    },
    search: {
      searchableFields: ['medication', 'subject', 'requester'],
      defaultSort: { field: 'authoredOn', order: 'desc' as const },
      filters: [
        {
          key: 'status',
          label: 'Status',
          type: 'select' as const,
          options: [
            { value: 'active', label: 'Active' },
            { value: 'on-hold', label: 'On Hold' },
            { value: 'cancelled', label: 'Cancelled' },
            { value: 'completed', label: 'Completed' },
          ],
        },
        {
          key: 'intent',
          label: 'Intent',
          type: 'select' as const,
          options: [
            { value: 'proposal', label: 'Proposal' },
            { value: 'plan', label: 'Plan' },
            { value: 'order', label: 'Order' },
          ],
        },
      ],
    },
    validation: {
      required: ['status', 'intent', 'medication', 'subject'],
    },
  } as ResourceHookConfig<MedicationRequest>,

  Condition: {
    resourceType: 'Condition' as const,
    displayName: 'Condition',
    description: 'Clinical condition or diagnosis',
    features: {
      enableCRUD: true,
      enableCaching: true,
      enableEnhancement: true,
      enablePagination: true,
      enableSearch: true,
      enableOffline: true,
      enableOptimisticUpdates: false,
    },
    crud: {
      enableOffline: true,
      enableCache: true,
      cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
    },
    cache: {
      ttl: 24 * 60 * 60 * 1000,
      enableAutoCleanup: true,
      maxCacheSize: 100,
    },
    state: {
      initialPageSize: 10,
      enablePagination: true,
      enableFilters: true,
      enableSearch: true,
    },
    search: {
      searchableFields: ['code', 'subject', 'asserter'],
      defaultSort: { field: 'recordedDate', order: 'desc' as const },
      filters: [
        {
          key: 'clinicalStatus',
          label: 'Clinical Status',
          type: 'select' as const,
          options: [
            { value: 'active', label: 'Active' },
            { value: 'recurrence', label: 'Recurrence' },
            { value: 'relapse', label: 'Relapse' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'remission', label: 'Remission' },
            { value: 'resolved', label: 'Resolved' },
          ],
        },
        {
          key: 'severity',
          label: 'Severity',
          type: 'select' as const,
          options: [
            { value: 'mild', label: 'Mild' },
            { value: 'moderate', label: 'Moderate' },
            { value: 'severe', label: 'Severe' },
          ],
        },
      ],
    },
    validation: {
      required: ['code', 'subject'],
    },
  } as ResourceHookConfig<Condition>,

  AllergyIntolerance: {
    resourceType: 'AllergyIntolerance' as const,
    displayName: 'Allergy Intolerance',
    description: 'Patient allergy or intolerance information',
    features: {
      enableCRUD: true,
      enableCaching: true,
      enableEnhancement: true,
      enablePagination: true,
      enableSearch: true,
      enableOffline: true,
      enableOptimisticUpdates: false, // Clinical data should be cautious
    },
    crud: {
      enableOffline: true,
      enableCache: true,
      cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
    },
    cache: {
      ttl: 24 * 60 * 60 * 1000,
      enableAutoCleanup: true,
      maxCacheSize: 100,
    },
    state: {
      initialPageSize: 15,
      enablePagination: true,
      enableFilters: true,
      enableSearch: true,
    },
    search: {
      searchableFields: ['code', 'patient', 'recorder'],
      defaultSort: { field: 'recordedDate', order: 'desc' as const },
      filters: [
        {
          key: 'clinicalStatus',
          label: 'Clinical Status',
          type: 'select' as const,
          options: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'resolved', label: 'Resolved' },
          ],
        },
        {
          key: 'criticality',
          label: 'Criticality',
          type: 'select' as const,
          options: [
            { value: 'low', label: 'Low' },
            { value: 'high', label: 'High' },
            { value: 'unable-to-assess', label: 'Unable to Assess' },
          ],
        },
        {
          key: 'type',
          label: 'Type',
          type: 'select' as const,
          options: [
            { value: 'allergy', label: 'Allergy' },
            { value: 'intolerance', label: 'Intolerance' },
          ],
        },
      ],
    },
    validation: {
      required: ['patient', 'code'],
    },
  } as ResourceHookConfig<AllergyIntolerance>,

  Immunization: {
    resourceType: 'Immunization' as const,
    displayName: 'Immunization',
    description: 'Patient immunization and vaccination records',
    features: {
      enableCRUD: true,
      enableCaching: true,
      enableEnhancement: true,
      enablePagination: true,
      enableSearch: true,
      enableOffline: true,
      enableOptimisticUpdates: false, // Clinical data should be cautious
    },
    crud: {
      enableOffline: true,
      enableCache: true,
      cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
    },
    cache: {
      ttl: 24 * 60 * 60 * 1000,
      enableAutoCleanup: true,
      maxCacheSize: 150, // Patients may have many immunizations
    },
    state: {
      initialPageSize: 20,
      enablePagination: true,
      enableFilters: true,
      enableSearch: true,
    },
    search: {
      searchableFields: ['vaccineCode', 'patient', 'performer'],
      defaultSort: { field: 'occurrenceDateTime', order: 'desc' as const },
      filters: [
        {
          key: 'status',
          label: 'Status',
          type: 'select' as const,
          options: [
            { value: 'completed', label: 'Completed' },
            { value: 'entered-in-error', label: 'Entered in Error' },
            { value: 'not-done', label: 'Not Done' },
          ],
        },
        {
          key: 'vaccineCode',
          label: 'Vaccine Type',
          type: 'text' as const,
        },
      ],
    },
    validation: {
      required: ['status', 'vaccineCode', 'patient'],
    },
  } as ResourceHookConfig<Immunization>,

  Encounter: {
    resourceType: 'Encounter' as const,
    displayName: 'Encounter',
    description: 'Healthcare visit or episode of care',
    features: {
      enableCRUD: true,
      enableCaching: true,
      enableEnhancement: true,
      enablePagination: true,
      enableSearch: true,
      enableOffline: true,
      enableOptimisticUpdates: false, // Clinical encounters should be handled carefully
    },
    crud: {
      enableOffline: true,
      enableCache: true,
      cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
    },
    cache: {
      ttl: 24 * 60 * 60 * 1000,
      enableAutoCleanup: true,
      maxCacheSize: 200, // Patients may have many encounters
    },
    state: {
      initialPageSize: 15,
      enablePagination: true,
      enableFilters: true,
      enableSearch: true,
    },
    search: {
      searchableFields: ['subject', 'participant', 'serviceProvider'],
      defaultSort: { field: 'period.start', order: 'desc' as const },
      filters: [
        {
          key: 'status',
          label: 'Status',
          type: 'select' as const,
          options: [
            { value: 'planned', label: 'Planned' },
            { value: 'arrived', label: 'Arrived' },
            { value: 'triaged', label: 'Triaged' },
            { value: 'in-progress', label: 'In Progress' },
            { value: 'onleave', label: 'On Leave' },
            { value: 'finished', label: 'Finished' },
            { value: 'cancelled', label: 'Cancelled' },
          ],
        },
        {
          key: 'class',
          label: 'Class',
          type: 'select' as const,
          options: [
            { value: 'ambulatory', label: 'Outpatient' },
            { value: 'emergency', label: 'Emergency' },
            { value: 'inpatient', label: 'Inpatient' },
            { value: 'home', label: 'Home Health' },
          ],
        },
        {
          key: 'type',
          label: 'Type',
          type: 'text' as const,
        },
      ],
    },
    validation: {
      required: ['status', 'class', 'subject'],
    },
  } as ResourceHookConfig<Encounter>,

  Organization: {
    resourceType: 'Organization' as const,
    displayName: 'Organization',
    description: 'Healthcare organization or facility',
    features: {
      enableCRUD: true,
      enableCaching: true,
      enableEnhancement: true,
      enablePagination: true,
      enableSearch: true,
      enableOffline: true,
      enableOptimisticUpdates: true,
    },
    crud: {
      enableOffline: true,
      enableCache: true,
      cacheTTL: 24 * 60 * 60 * 1000, // 24 hours (organizations change infrequently)
    },
    cache: {
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      enableAutoCleanup: true,
      maxCacheSize: 50, // Limited number of healthcare organizations
    },
    state: {
      initialPageSize: 20,
      enablePagination: true,
      enableFilters: true,
      enableSearch: true,
    },
    search: {
      searchableFields: ['name', 'alias', 'address', 'telecom'],
      defaultSort: { field: 'name', order: 'asc' as const },
      filters: [
        {
          key: 'active',
          label: 'Active',
          type: 'boolean' as const,
        },
        {
          key: 'type',
          label: 'Organization Type',
          type: 'select' as const,
          options: [
            { value: 'prov', label: 'Healthcare Provider' },
            { value: 'dept', label: 'Hospital Department' },
            { value: 'team', label: 'Care Team' },
            { value: 'govt', label: 'Government' },
            { value: 'ins', label: 'Insurance Company' },
            { value: 'edu', label: 'Educational Institute' },
            { value: 'reli', label: 'Religious Institution' },
            { value: 'other', label: 'Other' },
          ],
        },
        {
          key: 'name',
          label: 'Organization Name',
          type: 'text' as const,
        },
      ],
    },
    validation: {
      required: ['name'],
      custom: (organization: Organization) => {
        if (!organization.name || organization.name.trim().length === 0) {
          return 'Organization must have a name';
        }
        return null;
      },
    },
  } as ResourceHookConfig<Organization>,

  CareTeam: {
    resourceType: 'CareTeam' as const,
    displayName: 'Care Team',
    description: 'Team of healthcare professionals providing patient care',
    features: {
      enableCRUD: true,
      enableCaching: true,
      enableEnhancement: true,
      enablePagination: true,
      enableSearch: true,
      enableOffline: true,
      enableOptimisticUpdates: false, // Care teams should be handled carefully
    },
    crud: {
      enableOffline: true,
      enableCache: true,
      cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
    },
    cache: {
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      enableAutoCleanup: true,
      maxCacheSize: 100, // Care teams may be numerous
    },
    state: {
      initialPageSize: 15,
      enablePagination: true,
      enableFilters: true,
      enableSearch: true,
    },
    search: {
      searchableFields: ['name', 'subject', 'participant'],
      defaultSort: { field: 'name', order: 'asc' as const },
      filters: [
        {
          key: 'status',
          label: 'Status',
          type: 'select' as const,
          options: [
            { value: 'proposed', label: 'Proposed' },
            { value: 'active', label: 'Active' },
            { value: 'suspended', label: 'Suspended' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'entered-in-error', label: 'Entered in Error' },
          ],
        },
        {
          key: 'category',
          label: 'Category',
          type: 'text' as const,
        },
      ],
    },
    validation: {
      required: ['status', 'subject'],
    },
  } as ResourceHookConfig<CareTeam>,
};

/**
 * Helper function to get a resource configuration
 */
export function getResourceConfig<T extends Resource = Resource>(
  resourceType: ResourceType
): ResourceHookConfig<T> | undefined {
  return ResourceConfigs[resourceType as keyof typeof ResourceConfigs] as ResourceHookConfig<T>;
}

/**
 * Helper function to merge custom configuration with defaults
 */
export function mergeResourceConfig<T extends Resource = Resource>(
  baseConfig: ResourceHookConfig<T>,
  customConfig: Partial<ResourceHookConfig<T>>
): ResourceHookConfig<T> {
  return {
    ...baseConfig,
    ...customConfig,
    features: {
      ...baseConfig.features,
      ...customConfig.features,
    },
    crud: {
      ...baseConfig.crud,
      ...customConfig.crud,
    },
    cache: {
      ...baseConfig.cache,
      ...customConfig.cache,
    },
    enhancement: {
      ...baseConfig.enhancement,
      ...customConfig.enhancement,
    },
    state: {
      ...baseConfig.state,
      ...customConfig.state,
    },
    search: {
      ...baseConfig.search,
      ...customConfig.search,
    },
    validation: {
      ...baseConfig.validation,
      ...customConfig.validation,
    },
  };
}

/**
 * Type helper for resource-specific configurations
 */
export type PatientConfig = typeof ResourceConfigs.Patient;
export type PractitionerConfig = typeof ResourceConfigs.Practitioner;
export type ObservationConfig = typeof ResourceConfigs.Observation;
export type MedicationRequestConfig = typeof ResourceConfigs.MedicationRequest;
export type ConditionConfig = typeof ResourceConfigs.Condition;
export type AllergyIntoleranceConfig = typeof ResourceConfigs.AllergyIntolerance;
export type ImmunizationConfig = typeof ResourceConfigs.Immunization;
export type EncounterConfig = typeof ResourceConfigs.Encounter;
export type OrganizationConfig = typeof ResourceConfigs.Organization;
export type CareTeamConfig = typeof ResourceConfigs.CareTeam;
