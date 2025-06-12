"use client";

import { useState, useCallback, useEffect, useMemo } from 'react';
import { createLogger } from '../../../utils/logger';
import { FilterOption } from './usePractitionerFilters';
import { usePractitioner } from '../../../hooks/usePractitioner';
import { Practitioner } from '@medplum/fhirtypes';
import { toError } from '../../../services/medplum/ErrorService';

// Logger instance
const logger = createLogger('usePractitionerList');

// Define type for the hook's return
interface UsePractitionerListReturn {
  practitioners: any[];
  isLoading: boolean;
  error: Error | null;
  stats: {
    total: number;
    active: number;
    inactive: number;
    newPractitioners: number;
  };
  page: number;
  pageSize: number;
  totalPractitioners: number;
  handlePageChange: (newPage: number) => void;
  handlePageSizeChange: (newPageSize: number) => void;
  handleSort: (field: string, direction: 'asc' | 'desc') => void;
  handleSearch: (query: string) => void;
  handleFilter: (filters: FilterOption[]) => void;
  refetch: () => void;
}
// Transform Practitioner to match the component's expected format
const transformPractitioner = (practitioner: Practitioner): any => {
  // Parse qualification to get specialization
  let specialization = 'general-practitioner';
  if (practitioner.qualification && practitioner.qualification.length > 0) {
    const qual = practitioner.qualification[0];
    const codeText = qual.code?.text || '';
    if (codeText.includes('Cardiology')) specialization = 'cardiologist';
    else if (codeText.includes('Pediatrics')) specialization = 'pediatrician';
    else if (codeText.includes('Surgery')) specialization = 'surgeon';
    else if (codeText.includes('Dermatology')) specialization = 'dermatologist';
    else if (codeText.includes('Gynecology')) specialization = 'gynecologist';
    else if (codeText.includes('General Practice')) specialization = 'general-practitioner';
  }

  // Use the name array directly from FHIR Practitioner
  const nameArray = practitioner.name || [{ given: ['Unknown'], family: '' }];

  // Extract active status
  const active = practitioner.active !== false;

  return {
    id: practitioner.id || '',
    resourceType: 'Practitioner',
    name: nameArray,
    gender: practitioner.gender || 'unknown',
    birthDate: practitioner.birthDate || '1980-01-01',
    specialization,
    qualification: practitioner.qualification,
    telecom: practitioner.telecom || [],
    address: practitioner.address || [],
    active,
    status: active ? 'active' : 'inactive',
    availableTime: ['Monday-Friday, 9:00-17:00'],
    joinDate: practitioner.meta?.lastUpdated || '2020-01-01',
  };
};

/**
 * Refactored hook using the factory pattern for better performance and maintainability
 * This hook leverages the factory's built-in pagination, filtering, and state management
 */
export const usePractitionerList = (): UsePractitionerListReturn => {
  // Use the factory-generated hook with list configuration
  const {
    data,
    isLoading,
    error,
    pagination,
    filters,
    fetchMany,
    setPage,
    setPageSize,
    setFilters,
    setSearchTerm,
    setSort,
    refetch
  } = usePractitioner();

  // Initialize data loading on mount
  useEffect(() => {
    if (!data) {
      fetchMany({
        filters: {
          active: 'true', // Default to active practitioners
        },
        pagination: {
          page: 0,
          pageSize: 10
        }
      }).catch(err => {
        logger.error('Error loading initial practitioners:', err);
      });
    }
  }, [data, fetchMany]);

  // Transform practitioners data for UI consumption
  const transformedPractitioners = useMemo(() => {
    if (!data) return [];
    const practitionerArray = Array.isArray(data) ? data : [data];
    return practitionerArray.map(transformPractitioner);
  }, [data]);

  // Calculate stats from transformed data
  const stats = useMemo(() => ({
    total: transformedPractitioners.length,
    active: transformedPractitioners.filter(p => p.status === 'active').length,
    inactive: transformedPractitioners.filter(p => p.status === 'inactive').length,
    newPractitioners: transformedPractitioners.filter(p => {
      const joinDate = new Date(p.joinDate);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return joinDate >= thirtyDaysAgo;
    }).length
  }), [transformedPractitioners]);

  // Handler functions that leverage factory capabilities
  const handlePageChange = useCallback((newPage: number) => {
    logger.debug(`Changing page to ${newPage}`);
    setPage?.(newPage);
  }, [setPage]);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    logger.debug(`Changing page size to ${newPageSize}`);
    setPageSize?.(newPageSize);
    setPage?.(0); // Reset to first page
  }, [setPage, setPageSize]);

  const handleSort = useCallback((field: string, direction: 'asc' | 'desc') => {
    logger.debug(`Sorting by ${field} ${direction}`);
    setSort?.(field, direction);
  }, [setSort]);

  const handleSearch = useCallback((query: string) => {
    logger.debug(`Searching for "${query}"`);
    setSearchTerm?.(query);
    setPage?.(0); // Reset to first page
  }, [setSearchTerm, setPage]);

  const handleFilter = useCallback((newFilters: FilterOption[]) => {
    logger.debug('Applying filters', newFilters);

    // Convert FilterOption[] to factory filter format
    const filterMap: Record<string, string> = {};
    newFilters.forEach(filter => {
      switch (filter.category) {
        case 'status':
          filterMap['active'] = filter.value === 'active' ? 'true' : 'false';
          break;
        case 'gender':
          filterMap['gender'] = filter.value;
          break;
        case 'specialization':
        case 'qualification':
          filterMap['qualification'] = `code=${filter.value}`;
          break;
      }
    });

    setFilters?.(filterMap);
    setPage?.(0); // Reset to first page
  }, [setFilters, setPage]);

  const handleRefetch = useCallback(() => {
    logger.debug('Refetching practitioners');
    refetch();
  }, [refetch]);

  return {
    practitioners: transformedPractitioners,
    isLoading,
    error: toError(error),
    stats,
    page: pagination?.page || 0,
    pageSize: pagination?.pageSize || 10,
    totalPractitioners: pagination?.total || transformedPractitioners.length,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    handleSearch,
    handleFilter,
    refetch: handleRefetch
  };
};

export default usePractitionerList;
