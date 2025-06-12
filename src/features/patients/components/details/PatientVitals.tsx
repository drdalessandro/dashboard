/**
 * PatientVitals
 * Displays patient vital signs in a grid layout using dynamic data from FHIR Observations
 * Updated to use real database data instead of mock data
 */
import React from 'react';
import {
  Box,
  Typography,
  Paper,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert
} from '@mui/material';
import { Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Patient } from '@medplum/fhirtypes';
import { usePatientVitals } from '@/hooks/useObservation';
import { processVitalsFromObservations } from '../../utils/patientDataUtils';

// Define vital sign types for type safety
interface VitalSign {
  icon: string;
  label: string;
  value: string;
  unit: string;
  status: 'normal' | 'high' | 'low';
  lastUpdated?: string;
}

interface PatientVitalsProps {
  patient: Patient;
}

const PatientVitals: React.FC<PatientVitalsProps> = ({ patient }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch vitals data from database
  const { data: vitalsObservations, isLoading, error } = usePatientVitals(patient.id || '');

  // Process observations into vitals data
  const vitalSigns: VitalSign[] = React.useMemo(() => {
    if (!vitalsObservations || vitalsObservations.length === 0) {
      // Return default/empty vitals if no data
      return [
        {
          icon: '🩸',
          label: t('vitals.bloodPressure'),
          value: '-',
          unit: 'mmHg',
          status: 'normal',
        },
        {
          icon: '❤️',
          label: t('vitals.heartRate'),
          value: '-',
          unit: 'bpm',
          status: 'normal',
        },
        {
          icon: '🩺',
          label: t('vitals.glucose'),
          value: '-',
          unit: 'mg/dL',
          status: 'normal',
        },
        {
          icon: '💧',
          label: t('vitals.cholesterol'),
          value: '-',
          unit: 'mg/dL',
          status: 'normal',
        },
        {
          icon: '⚖️',
          label: 'Body Weight',
          value: '-',
          unit: 'kg',
          status: 'normal',
        }
      ];
    }

    // Process actual observations data
    const processed = processVitalsFromObservations(vitalsObservations);
    return processed.vitalsCards;
  }, [vitalsObservations, t]);

  // Log translation debugging information
  React.useEffect(() => {
    console.log('Current i18n language:', i18n.language);
    console.log('Current namespace:', i18n.options.ns);
    console.log('Is initialized:', i18n.isInitialized);

    // Verify specific translation keys
    try {
      const currentVitalsLabel = t('patient.currentVitals');
      const bloodPressureLabel = t('vitals.bloodPressure');
      console.log('Current Vitals Label:', currentVitalsLabel);
      console.log('Blood Pressure Label:', bloodPressureLabel);
    } catch (error) {
      console.error('Translation key lookup error:', error);
    }
  }, [t, i18n]);

  // Get color based on status
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'high':
        return theme.palette.error.main;
      case 'low':
        return theme.palette.warning.main;
      case 'normal':
      default:
        return theme.palette.success.main;
    }
  };

  // Get text color based on status
  const getStatusTextColor = (status: string): string => {
    switch (status) {
      case 'high':
        return theme.palette.error.light;
      case 'low':
        return theme.palette.warning.light;
      case 'normal':
      default:
        return theme.palette.success.light;
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <Box>
        <Typography variant="h6" component="h2" sx={{ mb: 3, fontWeight: 'bold' }}>
          {t('patient.currentVitals')}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box>
        <Typography variant="h6" component="h2" sx={{ mb: 3, fontWeight: 'bold' }}>
          {t('patient.currentVitals')}
        </Typography>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Failed to load vitals data. Showing placeholder values.
        </Alert>
        <Grid container spacing={3}>
          {vitalSigns.map((vital, index) => (
            <Grid item xs={12} sm={6} md={2.4} key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  height: '100%',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {vital.label}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mr: 1 }}>
                    {vital.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {vital.unit}
                  </Typography>
                </Box>

                <Typography
                  variant="body2"
                  sx={{
                    color: getStatusTextColor(vital.status),
                    bgcolor: `${getStatusColor(vital.status)}10`,
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    display: 'inline-block',
                    alignSelf: 'flex-start',
                    mt: 'auto'
                  }}
                >
                  {vital.status === 'normal' ? t('vitals.inTheNorm') : 
                   vital.status === 'high' ? t('vitals.aboveTheNorm') : 
                   t('vitals.belowTheNorm')}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" component="h2" sx={{ mb: 3, fontWeight: 'bold' }}>
        {t('patient.currentVitals')}
      </Typography>

      <Grid container spacing={3}>
        {vitalSigns.map((vital, index) => (
          <Grid item xs={12} sm={6} md={2.4} key={index}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                height: '100%',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography sx={{ fontSize: '16px' }}>{vital.icon}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                  {vital.label}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mr: 1 }}>
                  {vital.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {vital.unit}
                </Typography>
              </Box>

              <Typography
                variant="body2"
                sx={{
                  color: vital.status === 'normal' ? '#16a34a' : 
                        vital.status === 'high' ? '#dc2626' : '#ea580c',
                  bgcolor: vital.status === 'normal' ? '#dcfce7' : 
                          vital.status === 'high' ? '#fecaca' : '#fed7aa',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  display: 'inline-block',
                  alignSelf: 'flex-start',
                  mt: 'auto',
                  fontSize: '0.75rem',
                  fontWeight: 500
                }}
              >
                {vital.status === 'normal' ? 'Normal' : 
                 vital.status === 'high' ? 'High' : 'Low'}
              </Typography>

              {vital.lastUpdated && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.7rem' }}>
                  Updated: {new Date(vital.lastUpdated).toLocaleDateString()}
                </Typography>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default PatientVitals;