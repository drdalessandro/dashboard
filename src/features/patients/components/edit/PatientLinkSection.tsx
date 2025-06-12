/**
 * PatientLinkSection.tsx
 * 
 * Form section for managing patient-to-patient links (relationships between patients)
 */
import React, { useState } from 'react';
import { Patient } from '@medplum/fhirtypes';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Typography,
  Paper,
  Autocomplete,
  CircularProgress,
  Alert
} from '@mui/material';
import { Grid } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LinkIcon from '@mui/icons-material/Link';
import PersonIcon from '@mui/icons-material/Person';

import {
  PatientFormValues,
  PatientLinkFormData,
  PATIENT_LINK_TYPES,
  patientAdapter
} from '../../../../adapters/PatientAdapter';
import { FormCard } from '../../../common/components/forms';
import { useResource } from '../../../../hooks/useResource';

interface PatientLinkSectionProps {
  formValues: PatientFormValues;
  setFormValues: React.Dispatch<React.SetStateAction<PatientFormValues>>;
  errors: Partial<Record<keyof PatientFormValues, string>>;
  isSubmitting?: boolean;
}

interface PatientOption {
  id: string;
  label: string;
  name: string;
  birthDate?: string;
}

export const PatientLinkSection = React.memo<PatientLinkSectionProps>(({
  formValues,
  setFormValues,
  errors,
  isSubmitting = false
}) => {
  const { t } = useTranslation(['patient', 'common']);
  const [patientOptions, setPatientOptions] = useState<PatientOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const { searchResources } = useResource({ resourceType: 'Patient' });

  // Get patient link type options
  const linkTypeOptions = React.useMemo(() =>
    patientAdapter.getPatientLinkTypeOptions(), []
  );

  // Search for patients
  const searchPatients = React.useCallback(async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setPatientOptions([]);
      return;
    }

    setLoading(true);
    try {
      const results = await searchResources<Patient>({
        name: searchTerm,
        _count: 20
      });

      const options: PatientOption[] = results.map(patient => ({
        id: patient.id || '',
        label: `${patient.name?.[0]?.given?.[0] || ''} ${patient.name?.[0]?.family || ''}`.trim(),
        name: `${patient.name?.[0]?.given?.[0] || ''} ${patient.name?.[0]?.family || ''}`.trim(),
        birthDate: patient.birthDate || ''
      }));

      setPatientOptions(options);
    } catch (error) {
      console.error('Error searching patients:', error);
      setPatientOptions([]);
    } finally {
      setLoading(false);
    }
  }, [searchResources]);

  // Add new link entry
  const handleAddLink = React.useCallback(() => {
    const newLink: PatientLinkFormData = {
      other: '',
      type: 'refer'
    };

    setFormValues(prev => ({
      ...prev,
      link: [...prev.link, newLink]
    }));
  }, [setFormValues]);

  // Remove link entry
  const handleRemoveLink = React.useCallback((index: number) => {
    setFormValues(prev => ({
      ...prev,
      link: prev.link.filter((_, i) => i !== index)
    }));
  }, [setFormValues]);

  // Update link field
  const handleLinkChange = React.useCallback((
    index: number,
    field: keyof PatientLinkFormData,
    value: string
  ) => {
    setFormValues(prev => ({
      ...prev,
      link: prev.link.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  }, [setFormValues]);

  // Get patient display name
  const getPatientDisplayName = React.useCallback((patientId: string): string => {
    const option = patientOptions.find(opt => opt.id === patientId);
    return option?.name || patientId;
  }, [patientOptions]);

  return (
    <FormCard
      title={t('labels.patientLink.title', { ns: 'patient' })}
      icon={<LinkIcon color="primary" />}
    >
      <Grid container spacing={3}>
        {/* Link Entries */}
        {formValues.link.map((link, index) => (
          <Grid columns={12} key={index}>
            <Paper
              variant="outlined"
              sx={{ p: 2, bgcolor: 'grey.50' }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinkIcon fontSize="small" />
                  {t('labels.patientLink.entryTitle', { ns: 'patient' })} {index + 1}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => handleRemoveLink(index)}
                  disabled={isSubmitting}
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>

              <Grid container spacing={2}>
                {/* Patient Search */}
                <Grid columns={{ xs: 12, sm: 8 }}>
                  <Autocomplete
                    options={patientOptions}
                    loading={loading}
                    inputValue={searchText}
                    onInputChange={(_, newInputValue) => {
                      setSearchText(newInputValue);
                      searchPatients(newInputValue);
                    }}
                    onChange={(_, newValue) => {
                      if (newValue) {
                        handleLinkChange(index, 'other', newValue.id);
                      }
                    }}
                    getOptionLabel={(option) => option.label}
                    renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        <PersonIcon sx={{ mr: 1 }} />
                        <Box>
                          <Typography variant="body1">{option.name}</Typography>
                          {option.birthDate && (
                            <Typography variant="caption" color="text.secondary">
                              {t('labels.personalInfo.birthDate', { ns: 'patient' })}: {option.birthDate}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        label={t('labels.patientLink.searchPatient', { ns: 'patient' })}
                        placeholder={t('labels.patientLink.searchPlaceholder', { ns: 'patient' })}
                        disabled={isSubmitting}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loading && <CircularProgress color="inherit" size={16} />}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    noOptionsText={
                      searchText.length < 2
                        ? t('labels.patientLink.minSearchLength', { ns: 'patient' })
                        : t('labels.patientLink.noResults', { ns: 'patient' })
                    }
                    disabled={isSubmitting}
                  />
                </Grid>

                {/* Link Type */}
                <Grid columns={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{t('labels.patientLink.type', { ns: 'patient' })}</InputLabel>
                    <Select
                      value={link.type}
                      onChange={(e) => handleLinkChange(index, 'type', e.target.value)}
                      label={t('labels.patientLink.type', { ns: 'patient' })}
                      disabled={isSubmitting}
                    >
                      {linkTypeOptions.map((type) => (
                        <MenuItem key={type} value={type}>
                          {t(`labels.patientLink.types.${type}`, {
                            ns: 'patient',
                            defaultValue: type.charAt(0).toUpperCase() + type.slice(1)
                          })}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Selected Patient Display */}
                {link.other && (
                  <Grid columns={12}>
                    <Typography variant="body2" color="text.secondary">
                      {t('labels.patientLink.linkedTo', { ns: 'patient' })}: {getPatientDisplayName(link.other)}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>
        ))}

        {/* Add Link Button */}
        <Grid columns={12}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddLink}
              disabled={isSubmitting}
              sx={{ minWidth: 200 }}
            >
              {t('labels.patientLink.addLink', { ns: 'patient' })}
            </Button>
          </Box>
        </Grid>

        {/* Empty State */}
        {formValues.link.length === 0 && (
          <Grid columns={12}>
            <Alert severity="info">
              {t('labels.patientLink.emptyState', { ns: 'patient' })}
            </Alert>
          </Grid>
        )}

        {/* Help Text */}
        <Grid columns={12}>
          <Typography variant="caption" color="text.secondary">
            {t('labels.patientLink.helpText', { ns: 'patient' })}
          </Typography>
        </Grid>
      </Grid>
    </FormCard>
  );
});

PatientLinkSection.displayName = 'PatientLinkSection';

export default PatientLinkSection;