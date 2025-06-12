"use client";

import React, { useState } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Button,
  Menu,
  MenuItem,
  Chip,
  IconButton,
  Divider,
  Paper
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface FilterOption {
  field: string;
  value: string;
  label: string;
  type?: string;
}

interface SearchAndFilterProps {
  onSearch: (query: string) => void;
  onFilter: (filters: FilterOption[]) => void;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({ onSearch, onFilter }) => {
  const { t } = useTranslation(['patient', 'common']);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOption[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch(e.target.value);
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  const addFilter = (filter: FilterOption) => {
    // Remove existing filters with the same field
    const newFilters = filters.filter(f => f.field !== filter.field);

    // Add the new filter if it has a value
    const updatedFilters = filter.value ? [...newFilters, filter] : newFilters;

    setFilters(updatedFilters);
    onFilter(updatedFilters);
  };

  const removeFilter = (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const clearFilters = () => {
    setFilters([]);
    onFilter([]);
  };

  // Filter categories and options
  const filterCategories = [
    {
      name: t('patient.filters.categories.status'),
      options: [
        { field: 'active', value: 'true', label: t('patient.filters.active') },
        { field: 'active', value: 'false', label: t('patient.filters.inactive') },
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
          field: 'birthdateStart',
          value: 'custom',
          label: t('patient.filters.birthday_start'),
          type: 'date'
        },
        {
          field: 'birthdateEnd',
          value: 'custom',
          label: t('patient.filters.birthday_end'),
          type: 'date'
        }
      ]
    }
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2,
          borderColor: 'divider',
          width: '100%'
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          width="100%"
          flexWrap="nowrap"
        >
          <TextField
            fullWidth
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={t('search.placeholder', { ns: 'common', type: 'patients' })}
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSearchQuery('');
                      onSearch('');
                    }}
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{ mr: 2, flexGrow: 1, minWidth: 0 }}
          />
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={handleFilterClick}
            sx={{
              minWidth: { xs: 'auto', sm: 120 },
              flexShrink: 0,
              whiteSpace: 'nowrap'
            }}
          >
            {t('filter', { ns: 'common' })}
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleFilterClose}
            PaperProps={{
              sx: {
                width: 280,
                maxHeight: 400
              }
            }}
          >
            {filterCategories.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                {categoryIndex > 0 && <Divider />}
                <MenuItem disabled sx={{ opacity: 1 }}>
                  <strong>{category.name}</strong>
                </MenuItem>
                {category.options.map((option) => {
                  // Type guard to check if option has a type property
                  const isDateOption = 'type' in option && option.type === 'date';

                  return isDateOption ? (
                    <TextField
                      key={option.field}
                      type="date"
                      label={option.label}
                      variant="outlined"
                      fullWidth
                      margin="dense"
                      InputLabelProps={{
                        shrink: true,
                      }}
                      onChange={(e) => {
                        const dateFilter = {
                          field: option.field,
                          value: e.target.value,
                          label: option.label
                        };
                        addFilter(dateFilter);
                      }}
                    />
                  ) : (
                    <MenuItem
                      key={option.value}
                      onClick={() => {
                        addFilter(option);
                        handleFilterClose();
                      }}
                    >
                      {option.label}
                    </MenuItem>
                  );
                })}
              </div>
            ))}
          </Menu>
        </Box>
      </Paper>

      {filters.length > 0 && (
        <Box display="flex" alignItems="center" flexWrap="wrap" gap={1} mb={2}>
          {filters.map((filter, index) => (
            <Chip
              key={index}
              label={filter.label}
              onDelete={() => removeFilter(index)}
              size="small"
              color="primary"
              variant="outlined"
            />
          ))}
          {filters.length > 1 && (
            <Button
              size="small"
              onClick={clearFilters}
              sx={{ ml: 1 }}
              variant="text"
            >
              {t('common.clearAll')}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
};

export default SearchAndFilter;