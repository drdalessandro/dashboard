/**
 * GeneralPractitionerSection.tsx
 * 
 * Form section for managing patient's general practitioners (healthcare providers)
 * Enhanced with visual practitioner cards showing detailed information
 */
import React, { useCallback, useState, useEffect } from 'react';
import { Practitioner } from '@medplum/fhirtypes';
import { useTranslation } from 'react-i18next';
import {
  Box,
  TextField,
  Chip,
  Typography,
  Autocomplete,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Grid
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import DeleteIcon from '@mui/icons-material/Delete';
import BusinessIcon from '@mui/icons-material/Business';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import { PatientFormValues } from '../../../../adapters/PatientAdapter';
import { useResource } from '../../../../hooks/useResource';
import { PractitionerDisplayData, transformPractitionerForDisplay } from '../../../practitioners/utils/practitionerDataUtils';

interface GeneralPractitionerSectionProps {
  formValues: PatientFormValues;
  setFormValues: React.Dispatch<React.SetStateAction<PatientFormValues>>;
  errors: Partial<Record<keyof PatientFormValues, string>>;
  isSubmitting?: boolean;
}


export const GeneralPractitionerSection = React.memo<GeneralPractitionerSectionProps>(({
  formValues,
  setFormValues,
  isSubmitting = false
}) => {
  const { t } = useTranslation(['patient', 'common']);
  const [practitionerOptions, setPractitionerOptions] = useState<PractitionerDisplayData[]>([]);
  const [selectedPractitioner, setSelectedPractitioner] = useState<PractitionerDisplayData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);

  const { searchResources, fetchResource } = useResource({ resourceType: 'Practitioner' });

  // Load existing practitioner when component mounts or formValues change
  useEffect(() => {
    const loadExistingPractitioner = async () => {
      if (formValues.generalPractitioner.length > 0) {
        const practitionerId = formValues.generalPractitioner[0]; // Get the first (primary) practitioner

        if (practitionerId && (!selectedPractitioner || selectedPractitioner.id !== practitionerId)) {
          setLoadingExisting(true);
          try {
            const practitioner = await fetchResource(practitionerId);
            if (practitioner) {
              const displayData = transformPractitionerForDisplay(practitioner as Practitioner, t);
              setSelectedPractitioner(displayData);
            }
          } catch (error) {
            console.error('Error loading existing practitioner:', error);
          } finally {
            setLoadingExisting(false);
          }
        }
      } else {
        setSelectedPractitioner(null);
      }
    };

    loadExistingPractitioner();
  }, [formValues.generalPractitioner, fetchResource, t, selectedPractitioner]);

  // Search for practitioners using standard FHIR search parameters
  const searchPractitioners = useCallback(async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setPractitionerOptions([]);
      setSearchError(null);
      return;
    }

    setLoading(true);
    setSearchError(null);

    try {
      // Use standard FHIR search parameters for Practitioner resources
      const searchParams: Record<string, string> = {
        _count: '20',
        // Standard FHIR 'name' parameter performs substring search
        name: searchTerm.trim()
      };

      // Optional: Add additional search strategies for better results
      const nameParts = searchTerm.trim().split(/\s+/);
      if (nameParts.length > 1) {
        // If multiple words, also search by given and family names
        searchParams.given = nameParts[0];
        searchParams.family = nameParts[nameParts.length - 1];
      }

      console.log(t('messages.searchingPractitioners', { ns: 'practitioner' }), searchParams);
      const results = await searchResources<Practitioner>(searchParams);

      console.log(t('messages.searchResults', { ns: 'practitioner' }), results);

      if (results.length === 0) {
        setSearchError(t('errors.noPractitionersFound', { ns: 'practitioner' }));
      } else {
        setSearchError(null);
      }

      const options: PractitionerDisplayData[] = results.map((practitioner) => {
        // Use the centralized transform function for consistency
        const displayData = transformPractitionerForDisplay(practitioner, t);

        return {
          ...displayData,
          // Add label property for Autocomplete compatibility
          label: displayData.name || t('messages.unknownPractitioner', { ns: 'patient' })
        } as PractitionerDisplayData & { label: string };
      });

      setPractitionerOptions(options);
    } catch (error) {
      console.error(t('errors.searchError', { ns: 'common' }), error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(t('errors.searchError', { ns: 'common' }), errorMessage);
      setSearchError(t('errors.searchError', { ns: 'common' }));
      setPractitionerOptions([]);
    } finally {
      setLoading(false);
    }
  }, [searchResources, t]);

  // Handle practitioner selection (replace existing practitioner)
  const handlePractitionerSelect = React.useCallback((practitionerId: string) => {
    if (!practitionerId) {
      return;
    }

    const selectedOption = practitionerOptions.find(opt => opt.id === practitionerId);
    if (selectedOption) {
      setSelectedPractitioner(selectedOption);
    }

    // Replace the current practitioner with the new one
    setFormValues(prev => ({
      ...prev,
      generalPractitioner: [practitionerId] // Replace with single practitioner
    }));
    setSearchText('');
    setPractitionerOptions([]); // Clear search options
  }, [setFormValues, practitionerOptions]);

  // Remove practitioner
  const handleRemovePractitioner = React.useCallback(() => {
    setFormValues(prev => ({
      ...prev,
      generalPractitioner: []
    }));
    setSelectedPractitioner(null);
  }, [setFormValues]);


  return (
    <Grid container spacing={4}>
      {/* Left Column: Search and Add Practitioner */}
      <Grid item xs={12} md={6}>
        <Box>
          <Typography variant="h6" gutterBottom>
            {t('labels.generalPractitioner.search', { ns: 'patient' })}
          </Typography>
            <Autocomplete
              options={practitionerOptions}
              loading={loading}
              inputValue={searchText}
              onInputChange={(_, newInputValue) => {
                setSearchText(newInputValue);
                searchPractitioners(newInputValue);
              }}
              onChange={(_, newValue) => {
                if (newValue) {
                  handlePractitionerSelect(newValue.id);
                }
              }}
              getOptionLabel={(option) => (option as any).label || option.name}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                  <Box component="li" key={key} {...otherProps}>
                    <PersonIcon sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="body1">{option.name}</Typography>
                      {option.specialties?.length > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          {option.specialties[0]}
                        </Typography>
                      )} - {option.careTeam?.length > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          {option.careTeam[0].organization} - {option.careTeam[0].department}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={t('labels.generalPractitioner.searchPlaceholder', { ns: 'patient' })}
                  disabled={isSubmitting}
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
                  ? t('labels.generalPractitioner.minSearchLength', { ns: 'patient' })
                  : t('labels.generalPractitioner.noResults', { ns: 'patient' })
              }
              disabled={isSubmitting}
            />

            {/* Error Display */}
            {searchError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {searchError}
              </Alert>
            )}

            {/* Help Text */}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {t('labels.generalPractitioner.helpText', { ns: 'patient' })}
            </Typography>
          </Box>
        </Grid>

        {/* Right Column: Selected Practitioner Card */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            {t('labels.generalPractitioner.selected', { ns: 'patient' })}
          </Typography>

          {loadingExisting ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : selectedPractitioner ? (
            <Card
              variant="outlined"
              sx={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                position: 'relative'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                {/* Delete button positioned absolutely */}
                <IconButton
                  onClick={handleRemovePractitioner}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    color: '#ef4444',
                    '&:hover': {
                      backgroundColor: '#fef2f2'
                    }
                  }}
                  disabled={isSubmitting}
                >
                  <DeleteIcon />
                </IconButton>

                {/* Photo and Name Row */}
                <Grid container spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
                  {/* Photo Column */}
                  <Grid item xs={4}>
                    <Box sx={{ display: 'flex', justifyContent: 'left' }}>
                      <Avatar
                        src={selectedPractitioner.photo || undefined}
                        sx={{
                          width: 90,
                          height: 90,
                          fontSize: '1.5rem',
                          bgcolor: '#e2e8f0',
                          border: '1px solid #0ea5e9'
                        }}
                      >
                        {selectedPractitioner.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </Avatar>
                    </Box>
                  </Grid>

                  {/* Name and Specialty Column */}
                  <Grid item xs={8}>
                    <Box sx={{ textAlign: 'left', pr: 5 }}>
                      {/* Full name with title */}
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          color: '#1e293b',
                          mb: 1,
                          fontSize: '1.2rem',
                          lineHeight: 1.2
                        }}
                      >
                        {selectedPractitioner.name}
                      </Typography>

                      {/* Specialty */}
                      <Chip
                        label={selectedPractitioner.specialties?.[0] || 'General Practice'}
                        size="small"
                        sx={{
                          bgcolor: '#e0f2fe',
                          color: '#0369a1',
                          fontWeight: 500,
                          fontSize: '0.75rem'
                        }}
                      />
                    </Box>
                  </Grid>
                </Grid>

                {/* Details in two columns */}
                <Grid container spacing={2} sx={{ textAlign: 'left' }}>
                  {/* Organization and Department Row */}
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <BusinessIcon sx={{ fontSize: 16, color: '#64748b' }} />
                      <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                        Organization:
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#374151', fontSize: '0.875rem', mb: 1.5 }}>
                      {selectedPractitioner.careTeam?.[0]?.organization || 'Healthcare Organization'}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <BusinessIcon sx={{ fontSize: 16, color: '#64748b' }} />
                      <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                        Department:
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#374151', fontSize: '0.875rem', mb: 1.5 }}>
                      {selectedPractitioner.careTeam?.[0]?.department || 'Primary Care'}
                    </Typography>
                  </Grid>

                  {/* Phone and Email Row */}
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <PhoneIcon sx={{ fontSize: 16, color: '#64748b' }} />
                      <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                        Phone:
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#374151', fontSize: '0.875rem' }}>
                      {selectedPractitioner.phoneNumbers?.[0]?.value || 'Not available'}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <EmailIcon sx={{ fontSize: 16, color: '#64748b' }} />
                      <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                        Email:
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#374151', fontSize: '0.875rem' }}>
                      {selectedPractitioner.email?.[0]?.value || 'Not available'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ) : (
            <Alert severity="info">
              {t('labels.generalPractitioner.emptyState', { ns: 'patient' })}
            </Alert>
          )}
        </Grid>
      </Grid>
  );
});

GeneralPractitionerSection.displayName = 'GeneralPractitionerSection';

export default GeneralPractitionerSection;