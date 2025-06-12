"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FilterBar as DesignSystemFilterBar } from '@/components/designSystem';
import { FilterCategory, FilterOption } from '../hooks/usePractitionerFilters';

interface PractitionerFilterBarProps {
  onSearch: (query: string) => void;
  onFilter: (filters: FilterOption[]) => void;
  filterCategories: FilterCategory[];
  searchValue: string;
  filters: FilterOption[];
}

const PractitionerFilterBar: React.FC<PractitionerFilterBarProps> = ({
  onSearch,
  onFilter,
  filterCategories,
  searchValue: initialSearchValue = '',
  filters
}) => {
  const { t } = useTranslation(['practitioner', 'common']);
  const [localSearchValue, setLocalSearchValue] = useState(initialSearchValue);

  // Sync local state with prop changes
  useEffect(() => {
    setLocalSearchValue(initialSearchValue);
  }, [initialSearchValue]);

  // Handle search input change (only update local state)
  const handleSearchChange = useCallback((value: string) => {
    setLocalSearchValue(value);
  }, []);

  // Handle search execution (call parent onSearch)
  const handleSearchSubmit = useCallback((value: string) => {
    onSearch(value);
  }, [onSearch]);
  // Handle filter button click
  const handleFilterClick = useCallback(() => {
    // TODO: Implement filter modal or dropdown
    console.log('Filter clicked');
  }, []);

  // Handle bulk actions button click
  const handleBulkActionsClick = useCallback(() => {
    // TODO: Implement bulk actions menu
    console.log('Bulk actions clicked');
  }, []);

  return (
    <DesignSystemFilterBar
      searchValue={localSearchValue}
      searchPlaceholder={t('practitioner.search.placeholder')}
      onSearchChange={handleSearchChange}
      onSearch={handleSearchSubmit}
      onFilterClick={handleFilterClick}
      filterLabel={t('practitioner.filter.label', 'Filter')}
      onBulkActionsClick={handleBulkActionsClick}
      bulkActionsLabel={t('practitioner.bulkActions.label', 'Bulk Actions')}
    />
  );
};

export default PractitionerFilterBar;