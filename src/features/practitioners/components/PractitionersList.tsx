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
import PractitionerFilterBar from './PractitionerFilterBar';
import PractitionerStatsSection from './PractitionerStatsSection';
import PractitionerActionsBar from './PractitionerActionsBar';
import PractitionerTable from './table/PractitionerTable';

// Import hooks
import { usePractitionerList, usePractitionerFilters } from '../hooks';
import { FilterOption } from '../hooks/usePractitionerFilters';

// Initialize logger
const logger = createLogger('PractitionersList');

/**
 * Main PractitionersList component that orchestrates the practitioner list functionality
 */
export const PractitionersList: React.FC = () => {
  const { t } = useTranslation('practitioner');
  const router = useRouter();
  const { isOffline } = useNetworkStatus?.() || { isOffline: false };

  // Use the practitioner filters hook
  const {
    searchQuery,
    filters,
    filterCategories,
    handleSearchChange,
    addFilter,
    removeFilter,
    clearFilters,
    resetAll
  } = usePractitionerFilters();

  // Use the practitioner list hook with current filters
  const {
    practitioners,
    isLoading,
    error,
    stats,
    page,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    handleSearch: practitionerListHandleSearch,
    handleFilter: practitionerListHandleFilter,
    totalPractitioners,
    refetch
  } = usePractitionerList();

  // Sync filters from usePractitionerFilters to usePractitionerList with debounce
  // Only update when searchQuery or filters actually change
  const prevSearchQueryRef = React.useRef(searchQuery);
  const prevFiltersRef = React.useRef(filters);

  const listHandleSearchRef = useRef(practitionerListHandleSearch);
  const listHandleFilterRef = useRef(practitionerListHandleFilter);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Update refs when functions change
  useEffect(() => {
    listHandleSearchRef.current = practitionerListHandleSearch;
    listHandleFilterRef.current = practitionerListHandleFilter;
  }, [practitionerListHandleSearch, practitionerListHandleFilter]);

  useEffect(() => {
    if (!isMountedRef.current) return;

    const searchChanged = prevSearchQueryRef.current !== searchQuery;
    const filtersChanged = JSON.stringify(prevFiltersRef.current) !== JSON.stringify(filters);

    if (searchChanged || filtersChanged) {
      const timer = setTimeout(() => {
        if (!isMountedRef.current) return;

        logger.debug('Applying filters to practitioner list:', { searchQuery, filters });
        if (searchChanged) {
          listHandleSearchRef.current(searchQuery);
          prevSearchQueryRef.current = searchQuery;
        }
        if (filtersChanged) {
          listHandleFilterRef.current(filters);
          prevFiltersRef.current = [...filters];
        }
      }, 300); // 300ms debounce to prevent too many re-renders

      return () => clearTimeout(timer);
    }
  }, [searchQuery, filters, logger]);

  // Create navigate handlers
  const handleCreatePractitioner = useCallback(() => {
    logger.info(t('practitioner:actions.createPractitioner'));
    router.push('/practitioners/create');
  }, [router]);

  const handleViewPractitioner = useCallback((id: string) => {
    logger.info(t('practitioner:actions.viewPractitioner'), id);
    router.push(`/practitioners/show/${id}`);
  }, [router]);

  const handleEditPractitioner = useCallback((id: string) => {
    logger.info(t('practitioner:actions.editPractitioner'), id);
    router.push(`/practitioners/edit/${id}`);
  }, [router]);

  const handleDeletePractitioner = useCallback((id: string) => {
    // Show confirmation dialog before deleting
    if (window.confirm(t('practitioner.common.confirmDelete'))) {
      logger.info(t('practitioner:actions.deletePractitioner'), id);
      // Delete logic would go here
      // After delete, refetch the practitioners list
      refetch();
    }
  }, [t, refetch]);

  // Handle search with debouncing - remove searchQuery from deps to prevent loops
  const handleSearch = useCallback((query: string) => {
    logger.debug('Search query changed:', query);
    handleSearchChange(query);
  }, [handleSearchChange, logger]);

  const handleFilter = useCallback((newFilters: FilterOption[]) => {
    // Only update if filters have actually changed
    const filtersChanged = JSON.stringify(filters) !== JSON.stringify(newFilters);

    if (!filtersChanged) return;

    logger.debug(t('practitioner:filters.newFilters'), newFilters);

    // Call resetAll directly if no filters
    if (newFilters.length === 0) {
      logger.debug(t('practitioner:filters.noFilters'), newFilters);
      resetAll();
      return;
    }

    // Replace all filters with the new set
    clearFilters();
    newFilters.forEach(filter => {
      logger.debug(t('practitioner:filters.addingFilter'), filter);
      addFilter(filter);
    });
  }, [clearFilters, addFilter, resetAll, filters, t]);

  return (
    <Box sx={{ width: '100%' }}>
      {/* Page Header with design system component */}
      <PageHeader
        title={t('practitioner.list.title')}
        subtitle={t('practitioner.list.subtitle')}
        actions={
          <ActionButton
            variant="primary"
            startIcon={<PersonAddIcon />}
            onClick={handleCreatePractitioner}
            disabled={isOffline}
          >
            {t('practitioner.actions.create')}
          </ActionButton>
        }
      />

      {/* Search, filter and actions bar */}
      <Box sx={{ mb: 3 }}>
        <PractitionerFilterBar
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
      <PractitionerStatsSection
        total={stats.total}
        active={stats.active}
        inactive={stats.inactive}
        newPractitioners={stats.newPractitioners}
      />

      {/* Practitioner table */}
      <Box mt={4}>
        <PractitionerTable
          practitioners={practitioners}
          loading={isLoading}
          page={page}
          pageSize={pageSize}
          total={totalPractitioners}
          searchQuery={searchQuery}
          filters={filters}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onSort={handleSort}
          onView={handleViewPractitioner}
          onEdit={handleEditPractitioner}
          onDelete={handleDeletePractitioner}
        />
      </Box>
    </Box>
  );
};

export default PractitionersList;
