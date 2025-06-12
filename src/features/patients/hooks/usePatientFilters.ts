"use client";

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createLogger } from '@/utils/logger';

// Initialize logger
const logger = createLogger('usePatientFilters');

export interface FilterOption {
  field: string;
  value: string;
  label: string;
  type?: string;
}

/**
 * Hook for managing patient filters
 */
export const usePatientFilters = () => {
  const { t } = useTranslation('patient');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOption[]>([]);

  // Define filter categories and options
  const filterCategories = useMemo(() => [
    {
      name: t('patient.filters.categories.status'),
      options: [
        { field: 'status', value: 'active', label: t('patient.filters.active') },
        { field: 'status', value: 'inactive', label: t('patient.filters.inactive') },
      ]
    },
    {
      name: t('patient.filters.categories.gender'),
      options: [
        { field: 'gender', value: 'male', label: t('patient.filters.gender.male') },
        { field: 'gender', value: 'female', label: t('patient.filters.gender.female') },
        { field: 'gender', value: 'other', label: t('patient.filters.gender.other') },
        { field: 'gender', value: 'unknown', label: t('patient.filters.gender.unknown') },
      ]
    },
    // {
    //   name: t('patient.filters.categories.age'),
    //   options: [
    //     { field: 'age', value: 'child', label: t('patient.filters.child') },
    //     { field: 'age', value: 'adult', label: t('patient.filters.adult') },
    //     { field: 'age', value: 'elderly', label: t('patient.filters.elderly') },
    //   ]
    // },
    {
      name: t('patient.filters.categories.birthday'),
      options: [
        {
          field: 'birthDate',
          value: '',
          label: t('patient.filters.birthday_start'),
          type: 'date'
        }
      ]
    }
  ], [t]);

  // Log filter changes
  useEffect(() => {
    logger.debug('Current filters:', filters);
  }, [filters]);

  // Handle search input change
  const handleSearchChange = useCallback((value: string) => {
    logger.debug('Search query changed:', value);
    setSearchQuery(value);
  }, []);

  // Add a new filter
  const addFilter = useCallback((filter: FilterOption) => {
    setFilters(prevFilters => {
      // Remove existing filters with the same field
      const newFilters = prevFilters.filter(f => f.field !== filter.field);

      // Add the new filter if it has a value
      const updatedFilters = filter.value ? [...newFilters, filter] : newFilters;

      logger.debug('Added filter:', filter, 'Updated filters:', updatedFilters);
      return updatedFilters;
    });
  }, []);

  // Remove a filter by index
  const removeFilter = useCallback((index: number) => {
    setFilters(prevFilters => {
      const newFilters = prevFilters.filter((_, i) => i !== index);
      logger.debug('Removed filter at index:', index, 'Updated filters:', newFilters);
      return newFilters;
    });
  }, []);

  // Clear all filters - Fixed to not depend on filters.length which can cause stale closures
  const clearFilters = useCallback(() => {
    logger.debug('Clearing all filters');
    setFilters([]);
    logger.debug('Filters should now be empty');
  }, []);

  // Reset all filters and search - Fixed to emit consistent debug logs
  const resetAll = useCallback(() => {
    logger.debug('Resetting all search and filters');
    setSearchQuery('');
    setFilters([]);
    logger.debug('Search and filters reset - completed');
  }, []);

  // Convert filters to API format
  const apiFilters = useMemo(() => {
    return filters.reduce((acc, filter) => {
      return { ...acc, [filter.field]: filter.value };
    }, {});
  }, [filters]);

  return {
    // State
    searchQuery,
    filters,
    filterCategories,
    apiFilters,

    // Handlers
    handleSearchChange,
    addFilter,
    removeFilter,
    clearFilters,
    resetAll
  };
};

export default usePatientFilters;