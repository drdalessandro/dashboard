import React, { useCallback, useMemo, useState } from 'react';
import { 
  Box, 
  Menu, 
  MenuItem
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/material/styles';
import { SearchInput } from './SearchInput';
import { ActionButton, ButtonVariant } from './ActionButton';
import { useTranslation } from 'react-i18next';

// Types
export type FilterValue = {
  value: string;
  label: string;
};

export interface Filter {
  id: string;
  field: string;
  value: string;
  label: string;
  color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

export interface FilterOption {
  field: string;
  label: string;
  values: Array<{
    value: string;
    label: string;
  }>;
}

// Define prop types for the FilterBar component
interface FilterBarProps {
  // Search props
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch?: (value: string, event?: React.FormEvent) => void;
  searchDebounce?: number;
  
  // Filter props
  onFilterClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  filterLabel?: string;
  filterItems?: Array<{
    label: string;
    value: string;
    icon?: React.ReactNode;
    disabled?: boolean;
  }>;
  
  // Bulk actions props
  onBulkActionsClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  bulkActionsLabel?: string;
  bulkActionsItems?: Array<{
    label: string;
    onClick: (event: React.MouseEvent<HTMLElement>) => void;
    icon?: React.ReactNode;
    disabled?: boolean;
  }>;
  
  // Filter management
  filters?: Filter[];
  filterOptions?: FilterOption[];
  onAddFilter?: (filter: Omit<Filter, 'id'>) => void;
  onRemoveFilter?: (filterId: string) => void;
  onClearFilters?: () => void;
  
  // Event handlers with proper typing
  onFilterChange?: (filters: Filter[]) => void;
  onSearchSubmit?: (value: string) => void;
  
  // Styling
  filterVariant?: ButtonVariant;
  bulkActionsVariant?: ButtonVariant;
  showFilterButton?: boolean;
  showBulkActions?: boolean;
  
  // Legacy props (deprecated)
  placeholder?: string;
  
  // Additional props
  className?: string;
  style?: React.CSSProperties;
}

const FilterContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(3),
  width: '100%',
}));

const ActiveFiltersContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  marginTop: theme.spacing(1),
  width: '100%',
}));

const FilterChip = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  backgroundColor: theme.palette.action.selected,
  borderRadius: 16,
  padding: theme.spacing(0.5, 1.5, 0.5, 1.5),
  fontSize: '0.8125rem',
  '& .MuiSvgIcon-root': {
    marginLeft: theme.spacing(1),
    cursor: 'pointer',
    fontSize: '1rem',
    color: theme.palette.text.secondary,
    '&:hover': {
      color: theme.palette.text.primary,
    },
  },
}));

/**
 * FilterBar component provides a consistent interface for filtering and searching data.
 * It includes a search input, filter controls, and bulk action buttons.
 */
export const FilterBar = React.forwardRef<HTMLDivElement, FilterBarProps>(({
  // Search props
  searchValue = '',
  searchPlaceholder = 'Search',
  onSearchChange,
  onSearch,
  
  // Filter props
  onFilterClick,
  filterLabel,
  
  // Bulk actions
  onBulkActionsClick,
  bulkActionsLabel,
  
  // Filter management
  filters = [],
  filterOptions = [],
  onAddFilter,
  onRemoveFilter,
  onClearFilters,
  
  // Styling
  filterVariant = 'outline',
  bulkActionsVariant = 'ghost',
  showFilterButton = true,
  showBulkActions = true,
  
  // Container props
  className,
  style
}, ref) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterOption | null>(null);
  
  // Default labels using translations with proper typing
  const defaultLabels = useMemo(() => ({
    filter: t?.('common.filter', 'Filter') ?? 'Filter',
    clearAll: t?.('common.clearAll', 'Clear all') ?? 'Clear all',
    bulkActions: t?.('common.bulkActions', 'Bulk Actions') ?? 'Bulk Actions',
  }), [t]);
  
  
  const handleFilterMenuClose = useCallback(() => {
    setAnchorEl(null);
    setSelectedFilter(null);
  }, []);
  
  const handleFilterSelect = (option: FilterOption) => {
    setSelectedFilter(option);
  };
  
  const handleFilterValueSelect = (value: string) => {
    if (selectedFilter && onAddFilter) {
      onAddFilter({
        field: selectedFilter.field,
        value,
        label: `${selectedFilter.label}: ${value}`,
      });
    }
    handleFilterMenuClose();
  };
  
  const handleRemoveFilter = useCallback((filterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemoveFilter) {
      onRemoveFilter(filterId);
    }
  }, [onRemoveFilter]);
  
  const handleClearAllFilters = useCallback(() => {
    if (onClearFilters) {
      onClearFilters();
    }
  }, [onClearFilters]);
  
  const hasActiveFilters = filters && filters.length > 0;
  const hasFilterOptions = filterOptions && filterOptions.length > 0;
  
  return (
    <Box 
      ref={ref}
      className={className}
      style={style}
    >
      <FilterContainer>
        {/* Search Input */}
        <Box sx={{ flex: 1, minWidth: 200, maxWidth: 400 }}>
          <SearchInput
            value={searchValue}
            onChange={(value) => onSearchChange?.({ target: { value } } as React.ChangeEvent<HTMLInputElement>)}
            onSearch={onSearch}
            placeholder={searchPlaceholder}
            fullWidth
          />
        </Box>
        
        {/* Filter Button */}
        {showFilterButton && onFilterClick && (
          <ActionButton
            variant={filterVariant || 'outline'}
            startIcon={<FilterListIcon />}
            onClick={onFilterClick}
            aria-label={filterLabel || defaultLabels.filter}
          >
            {filterLabel || defaultLabels.filter}
          </ActionButton>
        )}
        
        {/* Bulk Actions Button */}
        {showBulkActions && onBulkActionsClick && (
          <ActionButton
            variant={bulkActionsVariant || 'outline'}
            startIcon={<MoreVertIcon />}
            onClick={onBulkActionsClick}
            aria-label={bulkActionsLabel || defaultLabels.bulkActions}
          >
            {bulkActionsLabel || defaultLabels.bulkActions}
          </ActionButton>
        )}
      </FilterContainer>
      
      {/* Active Filters */}
      {hasActiveFilters && (
        <ActiveFiltersContainer>
          {filters.map((filter) => (
            <FilterChip key={filter.id}>
              {filter.label}
              <CloseIcon 
                fontSize="small" 
                onClick={(e) => handleRemoveFilter(filter.id, e)}
                aria-label={`Remove filter: ${filter.label}`}
              />
            </FilterChip>
          ))}
          {/* Clear All Filters Button */}
          <ActionButton
            variant="outline"
            onClick={handleClearAllFilters}
            startIcon={<CloseIcon />}
          >
            {defaultLabels.clearAll}
          </ActionButton>
        </ActiveFiltersContainer>
      )}
      
      {/* Filter Menu */}
      {hasFilterOptions && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleFilterMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          {!selectedFilter ? (
            filterOptions.map((option) => (
              <MenuItem 
                key={option.field} 
                onClick={() => handleFilterSelect(option)}
              >
                {option.label}
              </MenuItem>
            ))
          ) : (
            selectedFilter.values.map((value) => (
              <MenuItem 
                key={value.value} 
                onClick={() => handleFilterValueSelect(value.value)}
              >
                {value.label}
              </MenuItem>
            ))
          )}
        </Menu>
      )}
    </Box>
  );
});

export default FilterBar;