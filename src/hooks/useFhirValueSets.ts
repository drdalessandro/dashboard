/**
 * useFhirValueSets.ts - Hook for accessing FHIR value sets
 * 
 * Provides easy access to FHIR value sets for dropdown components.
 * Supports filtering, grouping, and customization of value sets.
 */

import { useMemo } from 'react';
import {
  FHIR_VALUE_SETS,
  getDisplayForCode,
  getCodesFromValueSet,
  getDisplaysFromValueSet,
  filterValueSetByCategory,
  getContactRelationshipsByCategory,
  getLanguagesByRegion,
  getPractitionerQualificationsByCategory,
  type GenderCode,
  type MaritalStatusCode,
  type PatientStatusCode,
  type ContactPointSystemCode,
  type ContactPointUseCode,
  type AddressUseCode,
  type AddressTypeCode,
  type ContactRelationshipCode,
  type NamePrefixCode,
  type NameSuffixCode,
  type LanguageCode,
  type PractitionerQualificationCode
} from '../config/fhirValueSets';

/**
 * Interface for dropdown option
 */
export interface DropdownOption {
  value: string;
  label: string;
  description?: string;
  category?: string;
  disabled?: boolean;
}

/**
 * Interface for grouped dropdown options
 */
export interface GroupedDropdownOptions {
  [category: string]: DropdownOption[];
}

/**
 * Configuration for customizing value sets
 */
export interface ValueSetConfig {
  /** Include only specific codes */
  includeCodes?: string[];
  /** Exclude specific codes */
  excludeCodes?: string[];
  /** Filter by category (if supported by value set) */
  category?: string;
  /** Add custom options */
  customOptions?: DropdownOption[];
  /** Sort options alphabetically */
  sort?: boolean;
  /** Group options by category */
  grouped?: boolean;
}

/**
 * Hook for accessing FHIR value sets with customization options
 */
export function useFhirValueSets() {
  /**
   * Convert value set to dropdown options
   */
  const convertToDropdownOptions = useMemo(() => {
    return <T extends readonly { code: string; display: string; definition?: string; category?: string }[]>(
      valueSet: T,
      config: ValueSetConfig = {}
    ): DropdownOption[] => {
      let options = valueSet.map(item => ({
        value: item.code,
        label: item.display,
        description: 'definition' in item ? item.definition : undefined,
        category: 'category' in item ? item.category : undefined
      }));

      // Apply filters
      if (config.includeCodes) {
        options = options.filter(opt => config.includeCodes!.includes(opt.value));
      }

      if (config.excludeCodes) {
        options = options.filter(opt => !config.excludeCodes!.includes(opt.value));
      }

      if (config.category) {
        options = options.filter(opt => opt.category === config.category);
      }

      // Add custom options
      if (config.customOptions) {
        options = [...options, ...config.customOptions];
      }

      // Sort if requested
      if (config.sort) {
        options.sort((a, b) => a.label.localeCompare(b.label));
      }

      return options;
    };
  }, []);

  /**
   * Group dropdown options by category
   */
  const groupOptionsByCategory = useMemo(() => {
    return (options: DropdownOption[]): GroupedDropdownOptions => {
      const grouped: GroupedDropdownOptions = {};

      options.forEach(option => {
        const category = option.category || 'Other';
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(option);
      });

      // Sort each group
      Object.keys(grouped).forEach(category => {
        grouped[category].sort((a, b) => a.label.localeCompare(b.label));
      });

      return grouped;
    };
  }, []);

  return {
    // Core value sets
    valueSet: FHIR_VALUE_SETS,

    // Gender options
    genderOptions: useMemo(() => 
      convertToDropdownOptions(FHIR_VALUE_SETS.gender), [convertToDropdownOptions]
    ),

    // Marital status options
    maritalStatusOptions: useMemo(() => 
      convertToDropdownOptions(FHIR_VALUE_SETS.maritalStatus), [convertToDropdownOptions]
    ),

    // Patient status options
    patientStatusOptions: useMemo(() => 
      convertToDropdownOptions(FHIR_VALUE_SETS.patientStatus), [convertToDropdownOptions]
    ),

    // Contact point system options
    contactPointSystemOptions: useMemo(() => 
      convertToDropdownOptions(FHIR_VALUE_SETS.contactPointSystem), [convertToDropdownOptions]
    ),

    // Contact point use options
    contactPointUseOptions: useMemo(() => 
      convertToDropdownOptions(FHIR_VALUE_SETS.contactPointUse), [convertToDropdownOptions]
    ),

    // Address use options
    addressUseOptions: useMemo(() => 
      convertToDropdownOptions(FHIR_VALUE_SETS.addressUse), [convertToDropdownOptions]
    ),

    // Address type options
    addressTypeOptions: useMemo(() => 
      convertToDropdownOptions(FHIR_VALUE_SETS.addressType), [convertToDropdownOptions]
    ),

    // Contact relationship options
    contactRelationshipOptions: useMemo(() => 
      convertToDropdownOptions(FHIR_VALUE_SETS.contactRelationship), [convertToDropdownOptions]
    ),

    // Grouped contact relationship options
    contactRelationshipGrouped: useMemo(() => {
      const options = convertToDropdownOptions(FHIR_VALUE_SETS.contactRelationship);
      return groupOptionsByCategory(options);
    }, [convertToDropdownOptions, groupOptionsByCategory]),

    // Name prefix options
    namePrefixOptions: useMemo(() => 
      convertToDropdownOptions(FHIR_VALUE_SETS.namePrefix), [convertToDropdownOptions]
    ),

    // Name suffix options
    nameSuffixOptions: useMemo(() => 
      convertToDropdownOptions(FHIR_VALUE_SETS.nameSuffix), [convertToDropdownOptions]
    ),

    // Language options
    languageOptions: useMemo(() => 
      convertToDropdownOptions(FHIR_VALUE_SETS.language), [convertToDropdownOptions]
    ),

    // Grouped language options by region
    languageGrouped: useMemo(() => {
      const options = convertToDropdownOptions(FHIR_VALUE_SETS.language);
      return groupOptionsByCategory(options.map(opt => ({
        ...opt,
        category: FHIR_VALUE_SETS.language.find(lang => lang.code === opt.value)?.region
      })));
    }, [convertToDropdownOptions, groupOptionsByCategory]),

    // Practitioner qualification options
    practitionerQualificationOptions: useMemo(() => 
      convertToDropdownOptions(FHIR_VALUE_SETS.practitionerQualification), [convertToDropdownOptions]
    ),

    // Grouped practitioner qualification options
    practitionerQualificationGrouped: useMemo(() => {
      const options = convertToDropdownOptions(FHIR_VALUE_SETS.practitionerQualification);
      return groupOptionsByCategory(options);
    }, [convertToDropdownOptions, groupOptionsByCategory]),

    // Utility functions
    utils: {
      /**
       * Get custom options for any value set
       */
      getOptions: (valueSetName: keyof typeof FHIR_VALUE_SETS, config?: ValueSetConfig) => {
        const valueSet = FHIR_VALUE_SETS[valueSetName];
        const options = convertToDropdownOptions(valueSet as any, config);
        
        if (config?.grouped) {
          return groupOptionsByCategory(options);
        }
        
        return options;
      },

      /**
       * Get display for a specific code
       */
      getDisplayForCode: (valueSetName: keyof typeof FHIR_VALUE_SETS, code: string) => {
        return getDisplayForCode(FHIR_VALUE_SETS[valueSetName] as any, code);
      },

      /**
       * Convert to MUI Select format
       */
      toMuiSelectOptions: (options: DropdownOption[]) => {
        return options.map(opt => ({
          value: opt.value,
          label: opt.label,
          disabled: opt.disabled
        }));
      },

      /**
       * Convert grouped options to MUI Select format with option groups
       */
      toMuiSelectGroupedOptions: (groupedOptions: GroupedDropdownOptions) => {
        return Object.entries(groupedOptions).map(([category, options]) => ({
          label: category,
          options: options.map(opt => ({
            value: opt.value,
            label: opt.label,
            disabled: opt.disabled
          }))
        }));
      }
    }
  };
}

/**
 * Hook for specific value set with customization
 */
export function useFhirValueSet<T extends keyof typeof FHIR_VALUE_SETS>(
  valueSetName: T,
  config: ValueSetConfig = {}
) {
  const { utils } = useFhirValueSets();
  
  return useMemo(() => {
    const options = utils.getOptions(valueSetName, config);
    
    return {
      options: Array.isArray(options) ? options : [],
      grouped: config.grouped && !Array.isArray(options) ? options as GroupedDropdownOptions : null,
      muiOptions: config.grouped && !Array.isArray(options)
        ? utils.toMuiSelectGroupedOptions(options as GroupedDropdownOptions)
        : utils.toMuiSelectOptions(Array.isArray(options) ? options : [])
    };
  }, [valueSetName, config, utils]);
}

/**
 * Type-safe hooks for specific value sets
 */

export function useGenderOptions(config?: ValueSetConfig) {
  return useFhirValueSet('gender', config);
}

export function useMaritalStatusOptions(config?: ValueSetConfig) {
  return useFhirValueSet('maritalStatus', config);
}

export function usePatientStatusOptions(config?: ValueSetConfig) {
  return useFhirValueSet('patientStatus', config);
}

export function useContactPointSystemOptions(config?: ValueSetConfig) {
  return useFhirValueSet('contactPointSystem', config);
}

export function useContactPointUseOptions(config?: ValueSetConfig) {
  return useFhirValueSet('contactPointUse', config);
}

export function useAddressUseOptions(config?: ValueSetConfig) {
  return useFhirValueSet('addressUse', config);
}

export function useAddressTypeOptions(config?: ValueSetConfig) {
  return useFhirValueSet('addressType', config);
}

export function useContactRelationshipOptions(config?: ValueSetConfig) {
  return useFhirValueSet('contactRelationship', { grouped: true, ...config });
}

export function useNamePrefixOptions(config?: ValueSetConfig) {
  return useFhirValueSet('namePrefix', config);
}

export function useNameSuffixOptions(config?: ValueSetConfig) {
  return useFhirValueSet('nameSuffix', config);
}

export function useLanguageOptions(config?: ValueSetConfig) {
  return useFhirValueSet('language', { grouped: true, ...config });
}

export function usePractitionerQualificationOptions(config?: ValueSetConfig) {
  return useFhirValueSet('practitionerQualification', { grouped: true, ...config });
}