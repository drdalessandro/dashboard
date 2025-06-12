"use client";

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, CircularProgress, Alert, Button, AlertTitle } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Patient } from '@medplum/fhirtypes';
import DashboardLayout from '@/components/ui/layout/DashboardLayout';
import PatientDetailsLayout from '../components/details/PatientDetailsLayout';
import { usePatientDetails } from '../hooks/usePatientDetails';

interface PatientDetailsPageProps {
  params: {
    id: string;
  };
}

const PatientDetailsPage: React.FC<PatientDetailsPageProps> = ({ params }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation(['patient', 'common']);
  const patientId = params.id;

  const {
    diagnostics,
    isValidPatientId,
    patient,
    patientDisplayData,
    isLoading,
    error,
    refetch
  } = usePatientDetails(patientId);

  // Listen for refresh parameter and trigger data reload
  useEffect(() => {
    const shouldRefresh = searchParams.get('refresh');
    const timestamp = searchParams.get('timestamp');

    if (shouldRefresh === 'true' && timestamp && isValidPatientId) {
      // Clear the URL parameters first to avoid repeated refreshes
      const currentUrl = window.location.pathname;
      router.replace(currentUrl, { scroll: false });

      // Trigger comprehensive refetch of all patient data including care team
      refetch();

      console.log('All patient data refreshed after form save');
    }
  }, [searchParams, router, refetch, isValidPatientId]);

  // Error handling
  if (!isValidPatientId) {
    return (
      <DashboardLayout>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">{diagnostics.diagnosticMessage || t('errors.invalidId', { ns: 'common' })}</Alert>
        </Box>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  if (error) {
    // Only show "Patient not found" for genuine 404 errors, not fetch failures
    if (error instanceof Error && (
      error.message?.includes('404') || 
      (error.message?.includes('not found') && !error.message?.includes('fetch'))
    )) {
      return (
        <DashboardLayout>
          <Box sx={{ p: 3, textAlign: 'center', mt: 4 }}>
            <Alert
              severity="error"
              sx={{ maxWidth: 600, mx: 'auto' }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => router.push('/patients')}
                >
                  {t('buttons.backToList', { ns: 'common' })}
                </Button>
              }
            >
              <AlertTitle>{t('messages.patientNotFound', { ns: 'patient' })}</AlertTitle>
              {t('messages.patientDetailsNotFound', { ns: 'patient' })}
            </Alert>
          </Box>
        </DashboardLayout>
      );
    }

    // For fetch failures and other temporary errors, don't show error - let loading state handle it
    if (error instanceof Error && (
      error.message?.includes('fetch failed') || 
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('NetworkError') ||
      error.message?.includes('401') ||
      error.message?.includes('Authentication')
    )) {
      // Treat as loading state, not an error
      return (
        <DashboardLayout>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress />
          </Box>
        </DashboardLayout>
      );
    }

    // Handle other genuine errors
    return (
      <DashboardLayout>
        <Box sx={{ p: 3, textAlign: 'center', mt: 4 }}>
          <Alert
            severity="error"
            sx={{ maxWidth: 600, mx: 'auto' }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => refetch()}
              >
                {t('buttons.retry', { ns: 'common' })}
              </Button>
            }
          >
            <AlertTitle>{t('errorOccurred', { ns: 'common' })}</AlertTitle>
            {error instanceof Error ? error.message : t('unknownError', { ns: 'common' })}
          </Alert>
        </Box>
      </DashboardLayout>
    );
  }

  // Handle case where patient data is not available but no error was thrown
  if (!patient || !patientDisplayData) {
    // Create fallback patient data for testing modal functionality
    const fallbackPatient: Patient = {
      resourceType: 'Patient',
      id: 'fallback-patient',
      name: [{
        use: 'official',
        family: 'Fallback',
        given: ['Patient']
      }],
    };

    return (
      <DashboardLayout>
        <Box sx={{ p: 3, textAlign: 'center', mt: 4 }}>
          <Alert
            severity="warning"
            sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => router.push('/patients')}
              >
                {t('buttons.backToList', { ns: 'common' })}
              </Button>
            }
          >
            <AlertTitle>{t('messages.patientDataMissing', { ns: 'patient' })}</AlertTitle>
            {t('messages.patientDetailsDataMissing', { ns: 'patient' })}
          </Alert>

          {/* Fallback view with modal functionality for testing */}
          <PatientDetailsLayout patient={fallbackPatient} />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PatientDetailsLayout patient={patient || null} />
    </DashboardLayout>
  );
};

export default PatientDetailsPage;
