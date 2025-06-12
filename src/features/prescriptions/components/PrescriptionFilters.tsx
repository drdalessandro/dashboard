// src/features/prescriptions/components/PrescriptionFilters.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { SearchInput, FilterBar as DesignSystemFilterBar, Filter } from '@/components/designSystem';
import { PrescriptionFilters as PrescriptionFiltersType } from '../types/prescription.types';

interface PrescriptionFiltersProps {
  filters: PrescriptionFiltersType;
  onFilterChange: (filters: Partial<PrescriptionFiltersType>) => void;
  onClearFilters: () => void;
  hidePatientFilter?: boolean;
}

/**
 * Component for filtering prescriptions list using design system components
 * Supports filtering by medication name, status, patient, prescriber
 */
export const PrescriptionFilters: React.FC<PrescriptionFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  hidePatientFilter = false
}) => {
  const { t } = useTranslation(['prescription', 'common']);
  const [searchValue, setSearchValue] = useState(filters.medicationName || '');
  
  // Convert prescription filters to design system Filter format
  const activeFilters: Filter[] = [];
  
  if (filters.status) {
    activeFilters.push({
      id: `status-${filters.status}`,
      field: 'status',
      value: filters.status,
      label: t(`status.${filters.status}`, { ns: 'prescription' })
    });
  }
  
  if (filters.patientName && !hidePatientFilter) {
    activeFilters.push({
      id: `patient-${filters.patientName}`,
      field: 'patient',
      value: filters.patientName,
      label: filters.patientName
    });
  }
  
  if (filters.prescriberName) {
    activeFilters.push({
      id: `prescriber-${filters.prescriberName}`,
      field: 'prescriber',
      value: filters.prescriberName,
      label: filters.prescriberName
    });
  }

  // Define filter options for the design system FilterBar
  const filterOptions = [
    {
      field: 'status',
      label: t('fields.status', { ns: 'prescription' }),
      values: [
        { value: 'active', label: t('status.active', { ns: 'prescription' }) },
        { value: 'completed', label: t('status.completed', { ns: 'prescription' }) },
        { value: 'stopped', label: t('status.stopped', { ns: 'prescription' }) },
        { value: 'cancelled', label: t('status.cancelled', { ns: 'prescription' }) },
        { value: 'draft', label: t('status.draft', { ns: 'prescription' }) }
      ]
    }
  ];

  // Add patient filter option if not hidden
  if (!hidePatientFilter) {
    filterOptions.push({
      field: 'patient',
      label: t('fields.patient', { ns: 'prescription' }),
      values: [] // In a real app, this would be populated from patient data
    });
  }

  filterOptions.push({
    field: 'prescriber',
    label: t('fields.prescriber', { ns: 'prescription' }),
    values: [] // In a real app, this would be populated from prescriber data
  });

  // Handle search input change
  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
    onFilterChange({
      ...filters,
      medicationName: value || undefined
    });
  }, [filters, onFilterChange]);

  // Handle adding a filter
  const handleAddFilter = useCallback((filter: Omit<Filter, 'id'>) => {
    const newFilters: Partial<PrescriptionFiltersType> = {
      ...filters
    };

    switch (filter.field) {
      case 'status':
        newFilters.status = filter.value as any;
        break;
      case 'patient':
        newFilters.patientName = filter.value;
        break;
      case 'prescriber':
        newFilters.prescriberName = filter.value;
        break;
    }

    onFilterChange(newFilters);
  }, [filters, onFilterChange]);

  // Handle removing a filter
  const handleRemoveFilter = useCallback((filterId: string) => {
    const newFilters: Partial<PrescriptionFiltersType> = {
      ...filters
    };

    if (filterId.startsWith('status-')) {
      newFilters.status = undefined;
    } else if (filterId.startsWith('patient-')) {
      newFilters.patientName = undefined;
    } else if (filterId.startsWith('prescriber-')) {
      newFilters.prescriberName = undefined;
    }

    onFilterChange(newFilters);
  }, [filters, onFilterChange]);

  // Handle clearing all filters
  const handleClearFilters = useCallback(() => {
    setSearchValue('');
    onClearFilters();
  }, [onClearFilters]);

  // Sync search value with filters
  useEffect(() => {
    setSearchValue(filters.medicationName || '');
  }, [filters.medicationName]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Search Input */}
      <SearchInput
        placeholder={t('search.placeholder', { ns: 'prescription' })}
        value={searchValue}
        onChange={handleSearch}
        fullWidth
      />
      
      {/* Filter Bar */}
      <DesignSystemFilterBar
        filters={activeFilters}
        filterOptions={filterOptions}
        onAddFilter={handleAddFilter}
        onRemoveFilter={handleRemoveFilter}
        onClearFilters={handleClearFilters}
        placeholder={t('filter.placeholder', { ns: 'prescription' })}
      />
    </Box>
  );
};
