/**
 * DeceasedSection.tsx
 * 
 * Form section for managing patient deceased status with optional date/time
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  FormControl,
  FormControlLabel,
  Switch,
  TextField,
  Alert,
  Collapse
} from '@mui/material';
import { Grid } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import PersonOffIcon from '@mui/icons-material/PersonOff';

import { PatientFormValues } from '../../../../adapters/PatientAdapter';
import { FormCard } from '../../../common/components/forms';

interface DeceasedSectionProps {
  formValues: PatientFormValues;
  setFormValues: React.Dispatch<React.SetStateAction<PatientFormValues>>;
  errors: Partial<Record<keyof PatientFormValues, string>>;
  isSubmitting?: boolean;
}

export const DeceasedSection = React.memo<DeceasedSectionProps>(({
  formValues,
  setFormValues,
  errors,
  isSubmitting = false
}) => {
  const { t } = useTranslation(['patient', 'common']);

  // Handle deceased status toggle
  const handleDeceasedToggle = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const isDeceased = event.target.checked;
    setFormValues(prev => ({
      ...prev,
      deceased: isDeceased,
      // Clear deceased date/time if not deceased
      deceasedDateTime: isDeceased ? prev.deceasedDateTime : ''
    }));
  }, [setFormValues]);

  // Handle deceased date/time change
  const handleDeceasedDateTimeChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFormValues(prev => ({
      ...prev,
      deceasedDateTime: value
    }));
  }, [setFormValues]);

  return (
    <FormCard
      title={t('labels.deceased.title', { ns: 'patient' })}
      icon={<PersonOffIcon color="primary" />}
    >
      <Grid container spacing={3}>
        {/* Deceased Status Toggle */}
        <Grid columns={12}>
          <FormControl fullWidth>
            <FormControlLabel
              control={
                <Switch
                  checked={formValues.deceased || false}
                  onChange={handleDeceasedToggle}
                  disabled={isSubmitting}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonOffIcon fontSize="small" color={formValues.deceased ? 'error' : 'disabled'} />
                  <Typography variant="body1">
                    {t('labels.deceased.status', { ns: 'patient' })}
                  </Typography>
                </Box>
              }
            />
          </FormControl>
        </Grid>

        {/* Conditional Date/Time Input */}
        <Collapse in={formValues.deceased} timeout="auto" unmountOnExit>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid columns={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                {t('labels.deceased.note', { ns: 'patient' })}
              </Alert>
            </Grid>
            <Grid columns={12}>
              <TextField
                fullWidth
                label={t('labels.deceased.dateTime', { ns: 'patient' })}
                type="datetime-local"
                value={formValues.deceasedDateTime || ''}
                onChange={handleDeceasedDateTimeChange}
                disabled={isSubmitting}
                error={!!errors.deceasedDateTime}
                helperText={errors.deceasedDateTime || t('labels.deceased.dateTimeHelper', { ns: 'patient' })}
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  startAdornment: <EventIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
          </Grid>
        </Collapse>
      </Grid>
    </FormCard>
  );
});

DeceasedSection.displayName = 'DeceasedSection';

export default DeceasedSection;