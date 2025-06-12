/**
 * MaritalStatusSection.tsx
 * 
 * Form section for managing patient marital status with FHIR-compliant codes
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent
} from '@mui/material';
import { Favorite as FavoriteIcon } from '@mui/icons-material';

import { PatientFormValues } from '../../../../adapters/PatientAdapter';
import { useMaritalStatusOptions } from '../../../../hooks/useFhirValueSets';
import { FormCard, StyledFormControl } from '../../../common/components/forms';

interface MaritalStatusSectionProps {
  formValues: PatientFormValues;
  setFormValues: React.Dispatch<React.SetStateAction<PatientFormValues>>;
  errors: Partial<Record<keyof PatientFormValues, string>>;
  isSubmitting?: boolean;
}

export const MaritalStatusSection = React.memo<MaritalStatusSectionProps>(({
  formValues,
  setFormValues,
  errors,
  isSubmitting = false
}) => {
  const { t } = useTranslation(['patient', 'common']);
  const { options: maritalStatusOptions } = useMaritalStatusOptions({ sort: true });
  
  // Ensure the options are properly typed as an array
  const statusOptions = Array.isArray(maritalStatusOptions) ? maritalStatusOptions : [];

  // Handle marital status change
  const handleMaritalStatusChange = React.useCallback((event: SelectChangeEvent<string>) => {
    setFormValues(prev => ({
      ...prev,
      maritalStatus: event.target.value
    }));
  }, [setFormValues]);

  return (
    <FormCard
      title={t('labels.maritalStatus.title', { ns: 'patient' })}
      icon={<FavoriteIcon color="primary" />}
    >
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <fieldset style={{ 
            border: '1px solid rgba(0, 0, 0, 0.23)', 
            borderRadius: '4px', 
            padding: '0 12px', 
            margin: 0, 
            height: '46px', 
            display: 'flex', 
            alignItems: 'center' 
          }}>
            <legend style={{ 
              padding: '0 8px', 
              fontSize: '0.75rem', 
              color: 'rgba(0, 0, 0, 0.6)', 
              lineHeight: '12px' 
            }}>
              {t('labels.maritalStatus.label', { ns: 'patient' })}
            </legend>
            <StyledFormControl 
              fullWidth 
              error={!!errors.maritalStatus}
              disabled={isSubmitting}
              sx={{
                '& .MuiOutlinedInput-root': {
                  border: 'none',
                  height: '26px',
                  minHeight: '26px',
                  '& fieldset': {
                    border: 'none'
                  }
                }
              }}
            >
              <Select
                value={formValues.maritalStatus || ''}
                onChange={handleMaritalStatusChange}
                displayEmpty
                startAdornment={
                  <InputAdornment position="start">
                    <FavoriteIcon fontSize="small" />
                  </InputAdornment>
                }
              >
                <MenuItem value="">
                  <em>{t('labels.maritalStatus.selectOption', { ns: 'patient' })}</em>
                </MenuItem>
                {statusOptions.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {t(`labels.maritalStatus.options.${status.value}`, {
                      ns: 'patient',
                      defaultValue: status.label
                    })}
                  </MenuItem>
                ))}
              </Select>
            </StyledFormControl>
          </fieldset>
          {(errors.maritalStatus || t('labels.maritalStatus.helper', { ns: 'patient' })) && (
            <FormHelperText error={!!errors.maritalStatus} sx={{ marginTop: 1 }}>
              {errors.maritalStatus || t('labels.maritalStatus.helper', { ns: 'patient' })}
            </FormHelperText>
          )}
        </Grid>
      </Grid>
    </FormCard>
  );
});

MaritalStatusSection.displayName = 'MaritalStatusSection';

export default MaritalStatusSection;