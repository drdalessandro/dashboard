"use client";

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Box, Alert } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { createLogger } from '@/utils/logger';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

// Import design system components
import { PageHeader, ActionButton } from '@/components/designSystem';

// Import components
import PatientFilterBar from './PatientFilterBar';
import PatientStatsSection from './PatientStatsSection';
import PatientTable from './table/PatientTable';

// Import hooks
import { usePatientList, usePatientFilters } from '../hooks';
import { FilterOption } from '../hooks/usePatientFilters';
import { PatientTableProps } from '../types/patient.types';

// Initialize logger
const logger = createLogger('PatientsList');

/**
 * Main PatientsList component that orchestrates the patient list functionality
 */
export const PatientsList: React.FC = () => {
  const { t } = useTranslation('patient');
  const router = useRouter();
  const { isOffline } = useNetworkStatus?.() || { isOffline: false };

  // Use the patient filters hook
  const {
    searchQuery,
    filters,
    filterCategories,
    handleSearchChange,
    addFilter,
    removeFilter,
    clearFilters,
    resetAll
  } = usePatientFilters();

  // Use the patient list hook with current filters
  const {
    patients,
    isLoading,
    error,
    stats,
    page,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    handleSearch: patientListHandleSearch,
    handleFilter: patientListHandleFilter,
    totalPatients,
    refetch
  } = usePatientList();
  // Create stable refs for hook functions to prevent infinite loops
  const listHandleSearchRef = useRef(patientListHandleSearch);
  const listHandleFilterRef = useRef(patientListHandleFilter);
  const isMountedRef = useRef(true);

  // Update refs when hooks change
  useEffect(() => {
    listHandleSearchRef.current = patientListHandleSearch;
    listHandleFilterRef.current = patientListHandleFilter;
  }, [patientListHandleSearch, patientListHandleFilter]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Sync filters from usePatientFilters to usePatientList - FIXED to prevent loops
  useEffect(() => {
    if (!isMountedRef.current) return;

    // Debug log current filters before applying
    logger.debug('Applying filters to patient list:', { searchQuery, filters });

    // Use refs to prevent dependency loops
    listHandleSearchRef.current(searchQuery);
    listHandleFilterRef.current(filters);
  }, [searchQuery, filters, logger]); // Removed hook functions from dependencies

  // Format patients for table display with proper type transformation - memoized
  const formattedPatients = useMemo(() => {
    logger.debug(`Formatting ${patients.length} patients for table display`);

    return patients.map(patient => {
      // Format the patient data to match what the table expects
      // Extract the first name entry
      const nameObj = patient.name && patient.name.length > 0 ? patient.name[0] : { text: '', use: 'usual' };

      // Transform telecom to ensure 'system' is always a string
      const telecom = (patient.telecom || []).map(t => ({
        system: t.system || 'unknown', // Ensure system is a string
        value: t.value || '',
        use: t.use
      }));

      // Transform address to ensure 'use' and 'text' are strings
      const address = (patient.address || []).map(a => ({
        use: a.use || 'home', // Ensure use is a string
        text: a.text || ''
      }));

      // Transform identifiers to match expected format
      const identifier = (patient.identifier || []).map(id => ({
        value: id.value || '',
        system: id.system || ''
      }));
      // Safely construct the name text with proper type checking
      let nameText = 'Unknown';
      if (nameObj) {
        if (nameObj.text) {
          nameText = nameObj.text;
        } else if ('given' in nameObj && nameObj.given && 'family' in nameObj) {
          const givenName = Array.isArray(nameObj.given) ? nameObj.given.join(' ') : nameObj.given || '';
          const familyName = nameObj.family || '';
          nameText = `${givenName} ${familyName}`.trim() || 'Unknown';
        }
      }

      // Create a properly formatted patient object that matches PatientTableProps.patients
      return {
        id: patient.id,
        name: {
          text: nameText,
          use: nameObj?.use || 'usual'
        },
        gender: patient.gender || 'unknown',
        birthDate: patient.birthDate || '',
        telecom: telecom,
        address: address,
        status: patient.active || 'inactive',
        identifier: identifier,
        _offline: patient._offline || false
      };
    }) as PatientTableProps['patients']; // Explicitly cast to the expected type
  }, [patients, logger]);

  // Create navigate handlers - all memoized to prevent recreation
  const handleCreatePatient = useCallback(() => {
    logger.info('Creating new patient');
    router.push('/patients/create');
  }, [router, logger]);

  const handleViewPatient = useCallback((id: string) => {
    logger.info(`Viewing patient: ${id}`);
    router.push(`/patients/show/${id}`);
  }, [router, logger]);

  const handleEditPatient = useCallback((id: string) => {
    logger.info(`Editing patient: ${id}`);
    router.push(`/patients/edit/${id}`);
  }, [router, logger]);

  const handleDeletePatient = useCallback((id: string) => {
    // Show confirmation dialog before deleting
    if (window.confirm(t('patient.common.confirmDelete'))) {
      logger.info(`Deleting patient: ${id}`);
      // Delete logic would go here
      // After delete, refetch the patients list
      refetch();
    }
  }, [t, refetch, logger]);
  // Handle search and filters - separated to prevent circular calls
  const handleSearch = useCallback((query: string) => {
    logger.debug('Search query:', query);
    handleSearchChange(query);
  }, [handleSearchChange, logger]);

  // Fixed: Handle filters properly and manage empty filters array case
  const handleFilter = useCallback((newFilters: FilterOption[]) => {
    logger.debug('New filters received:', newFilters);

    // Call resetAll directly if no filters
    if (newFilters.length === 0) {
      logger.debug('No filters - resetting all');
      resetAll();
      return;
    }

    // Replace all filters with the new set
    clearFilters();
    newFilters.forEach(filter => {
      logger.debug('Adding filter:', filter);
      addFilter(filter);
    });
  }, [clearFilters, addFilter, resetAll, logger]);

  return (
    <Box sx={{ width: '100%' }}>
      {/* Page Header with design system component */}
      <PageHeader
        title={t('patient.list.title')}
        subtitle={t('patient.list.subtitle')}
        actions={
          <ActionButton
            variant="primary"
            startIcon={<PersonAddIcon />}
            onClick={handleCreatePatient}
            disabled={isOffline}
          >
            {t('patient.actions.create')}
          </ActionButton>
        }
      />

      {/* Search and filter bar */}
      <Box sx={{ mb: 3 }}>
        <PatientFilterBar
          onSearch={handleSearch}
          onFilter={handleFilter}
          filterCategories={filterCategories}
          searchValue={searchQuery}
          filters={filters}
        />
      </Box>
      {/* Error message */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 4, borderRadius: 2 }}
        >
          {error instanceof Error ? error.message : t('common.error')}
        </Alert>
      )}

      {/* Stats section */}
      <PatientStatsSection
        total={stats.total}
        active={stats.active}
        inactive={stats.inactive}
        newPatients={stats.newPatients}
      />

      {/* Patient table */}
      <Box mt={4}>
        <PatientTable
          patients={formattedPatients}
          loading={isLoading}
          page={page}
          pageSize={pageSize}
          total={totalPatients}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onEdit={handleEditPatient}
          onDelete={handleDeletePatient}
          onView={handleViewPatient}
          onSort={handleSort}
        />
      </Box>
    </Box>
  );
};

export default PatientsList;