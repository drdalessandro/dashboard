"use client";

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { SearchInput, FilterBar as DesignSystemFilterBar, Filter } from '@/components/designSystem';
import { FilterOption } from '../hooks/usePatientFilters';

interface PatientFilterBarProps {
  onSearch: (query: string) => void;
  onFilter: (filters: FilterOption[]) => void;
  filterCategories: Array<{
    name: string;
    options: FilterOption[];
  }>;
  searchValue: string;
  filters: FilterOption[];
}

const PatientFilterBar: React.FC<PatientFilterBarProps> = ({
  onSearch,
  onFilter,
  filterCategories,
  searchValue: initialSearchValue = '',
  filters
}) => {
  const { t } = useTranslation(['patient', 'common']);
  const [localSearchValue, setLocalSearchValue] = useState(initialSearchValue);

  // Sync local state with prop changes - but prevent infinite loops
  useEffect(() => {
    setLocalSearchValue(initialSearchValue);
  }, [initialSearchValue]);

  // Separate search input change from search execution to prevent loops
  const handleSearchChange = useCallback((value: string) => {
    setLocalSearchValue(value);
  }, []);

  const handleSearchSubmit = useCallback((value: string) => {
    onSearch(value);
  }, [onSearch]);

  // Memoize designSystemFilters to prevent recreation
  const designSystemFilters: Filter[] = useMemo(() => {
    return filters.map(filter => ({
      id: filter.id || `${filter.field}-${filter.value}`,
      field: filter.field,
      value: filter.value,
      label: filter.label || filter.value
    }));
  }, [filters]);

  // Memoize filterOptions to prevent recreation
  const filterOptions = useMemo(() => {
    return filterCategories.map(category => ({
      field: category.name,
      label: t(`patient.filter.categories.${category.name}`),
      values: category.options.map(option => ({
        value: option.value,
        label: option.label || t(`patient.filter.values.${option.field}.${option.value}`, option.value)
      }))
    }));
  }, [filterCategories, t]);
  // Handle filter changes from design system - memoized to prevent recreation
  const handleAddFilter = useCallback((filter: Omit<Filter, 'id'>) => {
    const newFilter: FilterOption = {
      id: `${filter.field}-${filter.value}-${Date.now()}`,
      field: filter.field,
      value: filter.value,
      label: filter.label
    };
    
    onFilter([...filters, newFilter]);
  }, [filters, onFilter]);

  const handleRemoveFilter = useCallback((filterId: string) => {
    onFilter(filters.filter(f => (f.id || `${f.field}-${f.value}`) !== filterId));
  }, [filters, onFilter]);

  const handleClearFilters = useCallback(() => {
    onFilter([]);
  }, [onFilter]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Search Input - separate change from submit */}
      <SearchInput
        placeholder={t('patient.search.placeholder')}
        value={localSearchValue}
        onChange={handleSearchChange}
        onSearch={handleSearchSubmit}
        fullWidth
      />
      
      {/* Filter Bar */}
      <DesignSystemFilterBar
        filters={designSystemFilters}
        filterOptions={filterOptions}
        onAddFilter={handleAddFilter}
        onRemoveFilter={handleRemoveFilter}
        onClearFilters={handleClearFilters}
        placeholder={t('patient.filter.placeholder')}
      />
    </Box>
  );
};

export default PatientFilterBar;