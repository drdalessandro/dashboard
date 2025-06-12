"use client";

import { useCallback, useEffect, useMemo } from 'react';
import { createLogger } from '../../../utils/logger';
import { FilterOption } from './usePatientFilters';
import { usePatient } from '../../../hooks/usePatient';
import { Patient as MedplumPatient } from '@medplum/fhirtypes';
import { Patient } from '../types/patient.types';
import { convertPatientFromFHIR, calculatePatientStats } from '../utils/patientTransformers';
import { toError } from '../../../services/medplum/ErrorService';

// Logger instance
const logger = createLogger('usePatientList');

// Define type for the hook's return
interface UsePatientListReturn {
  patients: Patient[];
  isLoading: boolean;
  error: Error | null;
  stats: {
    total: number;
    active: number;
    inactive: number;
    newPatients: {
      count: number;
      change: string;
    };
  };
  page: number;
  pageSize: number;
  totalPatients: number;
  handlePageChange: (newPage: number) => void;
  handlePageSizeChange: (newPageSize: number) => void;
  handleSort: (field: string, direction: 'asc' | 'desc') => void;
  handleSearch: (query: string) => void;
  handleFilter: (filters: FilterOption[]) => void;
  refetch: () => void;
}

// Transform Patient to match the component's expected format
const transformPatient = (patient: MedplumPatient): Patient => {
  return convertPatientFromFHIR(patient);
};

/**
 * Refactored hook using the factory pattern for better performance and maintainability
 * This hook leverages the factory's built-in pagination, filtering, and state management
 */
export const usePatientList = (): UsePatientListReturn => {
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
  } = usePatient();

  // Initialize data loading on mount
  useEffect(() => {
    if (!data) {
      fetchMany({
        filters: {
          active: 'true', // Default to active patients
        },
        pagination: {
          page: 0,
          pageSize: 10
        }
      }).catch(err => {
        logger.error('Error loading initial patients:', err);
      });
    }
  }, [data, fetchMany]);

  // Transform patient data for UI consumption
  const transformedPatients = useMemo(() => {
    if (!data) return [];
    const patientArray = Array.isArray(data) ? data : [data];
    return patientArray.map(transformPatient);
  }, [data]);

  // Calculate stats using the transformer utility
  const stats = useMemo(() => {
    const calculatedStats = calculatePatientStats(transformedPatients);

    // Ensure newPatients matches the expected type
    const newPatients = typeof calculatedStats.newPatients === 'object' && calculatedStats.newPatients !== null
      ? calculatedStats.newPatients
      : { count: 0, change: '0%' };

    return {
      total: calculatedStats.total,
      active: calculatedStats.active,
      inactive: calculatedStats.inactive,
      newPatients: {
        count: typeof newPatients.count === 'number' ? newPatients.count : 0,
        change: typeof newPatients.change === 'string' ? newPatients.change : '0%'
      }
    };
  }, [transformedPatients]);

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
      switch (filter.field) {
        case 'status':
          filterMap['active'] = filter.value === 'active' ? 'true' : 'false';
          break;
        case 'gender':
          filterMap['gender'] = filter.value;
          break;
        default:
          filterMap[filter.field] = filter.value;
      }
    });

    setFilters?.(filterMap);
    setPage?.(0); // Reset to first page
  }, [setFilters, setPage]);

  const handleRefetch = useCallback(() => {
    logger.debug('Refetching patients');
    refetch();
  }, [refetch]);

  return {
    patients: transformedPatients,
    isLoading,
    error: toError(error),
    stats,
    page: pagination?.page || 0,
    pageSize: pagination?.pageSize || 10,
    totalPatients: pagination?.total || transformedPatients.length,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    handleSearch,
    handleFilter,
    refetch: handleRefetch
  };
};

export default usePatientList;
