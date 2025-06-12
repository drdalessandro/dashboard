/**
 * ManagingOrganizationSection.tsx
 * 
 * Form section for managing patient's managing organization
 */
import React, { useState } from 'react';
import { Organization } from '@medplum/fhirtypes';
import { useTranslation } from 'react-i18next';
import {
  Box,
  TextField,
  Typography,
  Autocomplete,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import { Grid } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import ClearIcon from '@mui/icons-material/Clear';

import { PatientFormValues } from '../../../../adapters/PatientAdapter';
import { FormCard } from '../../../common/components/forms';
import { useResource } from '../../../../hooks/useResource';

interface ManagingOrganizationSectionProps {
  formValues: PatientFormValues;
  setFormValues: React.Dispatch<React.SetStateAction<PatientFormValues>>;
  errors: Partial<Record<keyof PatientFormValues, string>>;
  isSubmitting?: boolean;
}

interface OrganizationOption {
  id: string;
  label: string;
  name: string;
  type?: string;
}

export const ManagingOrganizationSection = React.memo<ManagingOrganizationSectionProps>(({
  formValues,
  setFormValues,
  errors,
  isSubmitting = false
}) => {
  const { t } = useTranslation(['patient', 'common']);
  const [organizationOptions, setOrganizationOptions] = useState<OrganizationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const { searchResources } = useResource({ resourceType: 'Organization' });

  // Search for organizations
  const searchOrganizations = React.useCallback(async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setOrganizationOptions([]);
      return;
    }

    setLoading(true);
    try {
      const results = await searchResources<Organization>({
        name: searchTerm,
        _count: 20
      });

      const options: OrganizationOption[] = results.map((organization) => ({
        id: organization.id || '',
        label: organization.name || '',
        name: organization.name || '',
        type: organization.type?.[0]?.coding?.[0]?.display || ''
      }));

      setOrganizationOptions(options);
    } catch (error) {
      console.error('Error searching organizations:', error);
      setOrganizationOptions([]);
    } finally {
      setLoading(false);
    }
  }, [searchResources]);

  // Handle organization selection
  const handleOrganizationSelect = React.useCallback((organizationId: string | null) => {
    setFormValues(prev => ({
      ...prev,
      managingOrganization: organizationId || ''
    }));
    setSearchText('');
  }, [setFormValues]);

  // Get organization display name
  const getOrganizationDisplayName = React.useCallback((organizationId: string): string => {
    const option = organizationOptions.find(opt => opt.id === organizationId);
    return option?.name || organizationId;
  }, [organizationOptions]);

  // Get selected organization
  const selectedOrganization = React.useMemo(() => {
    if (!formValues.managingOrganization) return null;
    return organizationOptions.find(opt => opt.id === formValues.managingOrganization) || {
      id: formValues.managingOrganization,
      label: getOrganizationDisplayName(formValues.managingOrganization),
      name: getOrganizationDisplayName(formValues.managingOrganization)
    };
  }, [formValues.managingOrganization, organizationOptions, getOrganizationDisplayName]);

  return (
    <FormCard
      title={t('labels.managingOrganization.title', { ns: 'patient' })}
      icon={<BusinessIcon color="primary" />}
    >
      <Grid container spacing={3}>
        {/* Search and Select Organization */}
        <Grid columns={12}>
          <Autocomplete
            options={organizationOptions}
            loading={loading}
            value={selectedOrganization}
            inputValue={searchText}
            onInputChange={(_, newInputValue) => {
              setSearchText(newInputValue);
              searchOrganizations(newInputValue);
            }}
            onChange={(_, newValue) => {
              handleOrganizationSelect(newValue?.id || null);
            }}
            getOptionLabel={(option) => option.label}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <BusinessIcon sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="body1">{option.name}</Typography>
                  {option.type && (
                    <Typography variant="caption" color="text.secondary">
                      {option.type}
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('labels.managingOrganization.search', { ns: 'patient' })}
                placeholder={t('labels.managingOrganization.searchPlaceholder', { ns: 'patient' })}
                disabled={isSubmitting}
                error={!!errors.managingOrganization}
                helperText={errors.managingOrganization}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading && <CircularProgress color="inherit" size={20} />}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            noOptionsText={
              searchText.length < 2
                ? t('labels.managingOrganization.minSearchLength', { ns: 'patient' })
                : t('labels.managingOrganization.noResults', { ns: 'patient' })
            }
            disabled={isSubmitting}
          />
        </Grid>

        {/* Selected Organization Display */}
        {formValues.managingOrganization && (
          <Grid columns={12}>
            <Typography variant="subtitle2" gutterBottom>
              {t('labels.managingOrganization.selected', { ns: 'patient' })}
            </Typography>
            <Chip
              label={getOrganizationDisplayName(formValues.managingOrganization)}
              onDelete={() => handleOrganizationSelect(null)}
              deleteIcon={<ClearIcon />}
              variant="outlined"
              color="primary"
              disabled={isSubmitting}
              icon={<BusinessIcon />}
            />
          </Grid>
        )}

        {/* Empty State */}
        {!formValues.managingOrganization && (
          <Grid columns={12}>
            <Alert severity="info">
              {t('labels.managingOrganization.emptyState', { ns: 'patient' })}
            </Alert>
          </Grid>
        )}

        {/* Help Text */}
        <Grid columns={12}>
          <Typography variant="caption" color="text.secondary">
            {t('labels.managingOrganization.helpText', { ns: 'patient' })}
          </Typography>
        </Grid>
      </Grid>
    </FormCard>
  );
});

ManagingOrganizationSection.displayName = 'ManagingOrganizationSection';

export default ManagingOrganizationSection;