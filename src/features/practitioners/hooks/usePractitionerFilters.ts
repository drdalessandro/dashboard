"use client";

import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { createLogger } from '../../../utils/logger';

// Logger instance
const logger = createLogger('usePractitionerFilters');

// Filter option structure
export interface FilterOption {
  id: string;
  category: string;
  value: string;
  label: string;
}

// Filter category definition
export interface FilterCategory {
  id: string;
  label: string;
  options: {
    value: string;
    label: string;
  }[];
}

/**
 * Custom hook for managing practitioner list filters
 * Similar to usePatientFilters but adapted for practitioners
 */
export const usePractitionerFilters = () => {
  const { t } = useTranslation(['practitioner', 'common']);

  // State for search query and filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filters, setFilters] = useState<FilterOption[]>([]);

  // Define filter categories available for practitioner filtering
  const filterCategories = useMemo<FilterCategory[]>(() => [
    {
      id: 'status',
      label: t('filters.status.title', { ns: 'practitioner' }),
      options: [
        { value: 'active', label: t('filters.status.active', { ns: 'practitioner' }) },
        { value: 'inactive', label: t('filters.status.inactive', { ns: 'practitioner' }) }
      ]
    },
    {
      id: 'gender',
      label: t('filters.gender.title', { ns: 'practitioner' }),
      options: [
        { value: 'male', label: t('filters.gender.male', { ns: 'practitioner' }) },
        { value: 'female', label: t('filters.gender.female', { ns: 'practitioner' }) },
        { value: 'other', label: t('filters.gender.other', { ns: 'practitioner' }) },
        { value: 'unknown', label: t('filters.gender.unknown', { ns: 'practitioner' }) }
      ]
    },
    {
      id: 'specialization',
      label: t('filters.specialization', { ns: 'practitioner' }),
      options: [
        { value: 'general-practitioner', label: t('filters.specialization.generalPractitioner', { ns: 'practitioner' }) },
        { value: 'cardiologist', label: t('filters.specialization.cardiologist', { ns: 'practitioner' }) },
        { value: 'pediatrician', label: t('filters.specialization.pediatrician', { ns: 'practitioner' }) },
        { value: 'surgeon', label: t('filters.specialization.surgeon', { ns: 'practitioner' }) },
        { value: 'dermatologist', label: t('filters.specialization.dermatologist', { ns: 'practitioner' }) },
        { value: 'gynecologist', label: t('filters.specialization.gynecologist', { ns: 'practitioner' }) }
      ]
    },
    {
      id: 'qualification',
      label: t('filters.qualification', { ns: 'practitioner' }),
      options: [
        { value: 'doctor', label: t('filters.qualification.doctor', { ns: 'practitioner' }) },
        { value: 'nurse', label: t('filters.qualification.nurse', { ns: 'practitioner' }) },
        { value: 'therapist', label: t('filters.qualification.therapist', { ns: 'practitioner' }) },
        { value: 'other', label: t('filters.qualification.other', { ns: 'practitioner' }) },
        { value: 'unknown', label: t('filters.qualification.unknown', { ns: 'practitioner' }) }
      ]
    }
  ], [t]);

  // Handle search input changes
  const handleSearchChange = useCallback((query: string) => {
    logger.debug(`Search query changed: "${query}"`);
    setSearchQuery(query);
  }, []);

  // Add a filter
  const addFilter = useCallback((filter: FilterOption) => {
    logger.debug(`Adding filter: ${JSON.stringify(filter)}`);
    setFilters(prev => {
      // Check if filter of same category already exists
      const existingFilterIndex = prev.findIndex(f => f.category === filter.category);

      // If the filter value is empty, remove the filter
      if (!filter.value) {
        return prev.filter(f => f.category !== filter.category);
      }

      if (existingFilterIndex >= 0) {
        // Replace the existing filter if same category
        const newFilters = [...prev];
        newFilters[existingFilterIndex] = filter;
        return newFilters;
      }
      
      // Add new filter
      return [...prev, filter];
    });
  }, []);

  // Remove a filter
  const removeFilter = useCallback((filterId: string) => {
    logger.debug(`Removing filter: ${filterId}`);
    setFilters(prev => prev.filter(f => f.id !== filterId));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    logger.debug('Clearing all filters');
    setFilters([]);
  }, []);

  // Reset all (both search and filters)
  const resetAll = useCallback(() => {
    logger.debug('Resetting all filters and search');
    setSearchQuery('');
    setFilters([]);
  }, []);

  return {
    searchQuery,
    filters,
    filterCategories,
    handleSearchChange,
    addFilter,
    removeFilter,
    clearFilters,
    resetAll
  };
};

export default usePractitionerFilters;
