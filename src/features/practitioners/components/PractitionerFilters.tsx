"use client"

// src/features/practitioners/components/PractitionerFilters.tsx
import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Popover,
  Card,
  CardContent,
  Typography,
  Stack,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import { useTranslation } from 'react-i18next';
import { PractitionerFilters as PractitionerFiltersType } from '../types/practitioner.types';
import { createLogger } from '../../../utils/logger';

interface PractitionerFiltersProps {
  filters: PractitionerFiltersType;
  onFilterChange: (filters: Partial<PractitionerFiltersType>) => void;
  onClearFilters: () => void;
}

/**
 * Component for filtering practitioners list
 * Supports filtering by name, gender, and qualification
 */
export const PractitionerFilters: React.FC<PractitionerFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters
}) => {
  const { t } = useTranslation(['practitioner', 'common']);
  const logger = createLogger('PractitionerFilters');
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  // Local state for form values (to avoid immediate filtering while typing)
  const [nameFilter, setNameFilter] = useState(filters.name || '');
  const [genderFilter, setGenderFilter] = useState(filters.gender || '');
  const [qualificationFilter, setQualificationFilter] = useState(filters.qualifications?.[0]?.code || '');

  // Open/close filter popover
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Apply filters - This is where the change happens
  const handleApplyFilters = () => {
    logger.debug('Applying filters', { nameFilter, genderFilter, qualificationFilter });

    // Only apply filters that have actually changed, to prevent unnecessary re-renders
    const newFilters: Partial<PractitionerFiltersType> = {};

    if (nameFilter !== filters.name) {
      newFilters.name = nameFilter || undefined;
    }

    if (genderFilter !== filters.gender) {
      newFilters.gender = genderFilter as any || undefined;
    }

    if (qualificationFilter !== (filters.qualifications?.[0]?.code || '')) {
      newFilters.qualifications = qualificationFilter
        ? [{ code: qualificationFilter }]
        : undefined;
    }

    // Only call onFilterChange if there are actual changes
    if (Object.keys(newFilters).length > 0) {
      onFilterChange(newFilters);
    }

    handleClose();
  };

  // Reset filters
  const handleResetFilters = () => {
    logger.debug('Resetting filters');
    setNameFilter('');
    setGenderFilter('');
    setQualificationFilter('');
    onClearFilters();
    handleClose();
  };

  // Count active filters
  const activeFilterCount = [
    !!filters.name,
    !!filters.gender,
    !!filters.qualifications
  ].filter(Boolean).length;

  const open = Boolean(anchorEl);
  const id = open ? 'practitioner-filters-popover' : undefined;

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title={t('filter.title', { ns: 'common' })}>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={handleClick}
            color={activeFilterCount > 0 ? "primary" : "inherit"}
            aria-describedby={id}
          >
            {t('actions.filters', { ns: 'common' })}
            {activeFilterCount > 0 && ` (${activeFilterCount})`}
          </Button>
        </Tooltip>

        {activeFilterCount > 0 && (
          <Tooltip title={t('actions.clearFilters', { ns: 'common' })}>
            <IconButton
              color="primary"
              onClick={onClearFilters}
              size="small"
              sx={{ ml: 1 }}
            >
              <ClearAllIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Card sx={{ minWidth: 300, maxWidth: 400 }}>
          <CardContent>
            <Typography variant="h6">
              {t('filter.title', { ns: 'common' })}
            </Typography>

            <Stack spacing={2}>
              {/* Name filter */}
              <TextField
                label={t('filters.name', { ns: 'patient' })}
                variant="outlined"
                fullWidth
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                size="small"
              />

              {/* Gender filter */}
              <TextField
                select
                label={t('filters.gender', { ns: 'patient' })}
                variant="outlined"
                fullWidth
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                size="small"
              >
                <MenuItem value="">
                  <em>{t('none', { ns: 'common' })}</em>
                </MenuItem>
                <MenuItem value="male">{t('gender.male', { ns: 'common' })}</MenuItem>
                <MenuItem value="female">{t('gender.female', { ns: 'common' })}</MenuItem>
                <MenuItem value="other">{t('gender.other', { ns: 'common' })}</MenuItem>
                <MenuItem value="unknown">{t('gender.unknown', { ns: 'common' })}</MenuItem>
              </TextField>

              {/* Qualification filter */}
              <TextField
                label={t('filters.qualification', { ns: 'patient' })}
                variant="outlined"
                fullWidth
                value={qualificationFilter}
                onChange={(e) => setQualificationFilter(e.target.value)}
                size="small"
              />

              <Divider />

              {/* Actions */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  onClick={handleResetFilters}
                >
                  {t('actions.reset', { ns: 'common' })}
                </Button>
                <Button
                  variant="contained"
                  onClick={handleApplyFilters}
                >
                  {t('actions.apply', { ns: 'common' })}
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Popover>
    </>
  );
};