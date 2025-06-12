"use client";

import React, { useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { Box, CircularProgress, Alert, Button, AlertTitle } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Practitioner } from '@medplum/fhirtypes';
import DashboardLayout from '@/components/ui/layout/DashboardLayout';
import PractitionerDetailsLayout from '../components/details/PractitionerDetailsLayout';
import { usePractitionerById } from '@/hooks/usePractitionerById';

const PractitionerDetailPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ id: string }>();
  const { t } = useTranslation(['practitioner', 'common']);
  const practitionerId = params?.id || '';

  // Track if this is the initial load
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = React.useState(false);

  const {
    data: practitioner,
    isLoading,
    error,
    refetch
  } = usePractitionerById(practitionerId);

  // Update hasInitiallyLoaded when loading state changes
  React.useEffect(() => {
    if (!isLoading && !hasInitiallyLoaded) {
      setHasInitiallyLoaded(true);
    }
  }, [isLoading, hasInitiallyLoaded]);

  // Listen for refresh parameter and trigger data reload
  useEffect(() => {
    const shouldRefresh = searchParams.get('refresh');
    const timestamp = searchParams.get('timestamp');

    if (shouldRefresh === 'true' && timestamp && practitionerId) {
      // Clear the URL parameters first to avoid repeated refreshes
      const currentUrl = window.location.pathname;
      router.replace(currentUrl, { scroll: false });

      // Trigger comprehensive refetch of all practitioner data
      refetch();

      console.log('All practitioner data refreshed after form save');
    }
  }, [searchParams, router, refetch, practitionerId]);

  // Error handling
  if (!practitionerId) {
    return (
      <DashboardLayout>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">{t('errors.invalidId', { ns: 'common' })}</Alert>
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

  if (error && hasInitiallyLoaded) {
    // Handle specific not found error
    if (error instanceof Error && (error.message?.includes('not found') || error.message?.includes('Not Found') || error.message?.includes('404'))) {
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
                  onClick={() => router.push('/practitioners')}
                >
                  {t('buttons.backToList', { ns: 'common' })}
                </Button>
              }
            >
              <AlertTitle>{t('messages.practitionerNotFound', { ns: 'practitioner' })}</AlertTitle>
              {t('messages.practitionerDetailsNotFound', { ns: 'practitioner' })}
            </Alert>
          </Box>
        </DashboardLayout>
      );
    }

    // Handle other errors
    return (
      <DashboardLayout>
        <Box sx={{ p: 3, textAlign: 'center', mt: 4 }}>
          <Alert
            severity="error"
            sx={{ maxWidth: 600, mx: 'auto' }}
          >
            <AlertTitle>{t('errorOccurred', { ns: 'common' })}</AlertTitle>
            {error instanceof Error ? error.message : t('unknownError', { ns: 'common' })}
          </Alert>
        </Box>
      </DashboardLayout>
    );
  }

  // Handle case where practitioner data is not available but no error was thrown
  if (!practitioner && !isLoading && hasInitiallyLoaded) {
    // Create fallback practitioner data for testing modal functionality
    const fallbackPractitioner: Practitioner = {
      resourceType: 'Practitioner',
      id: 'fallback-practitioner',
      name: [{
        use: 'official',
        family: 'Fallback',
        given: ['Practitioner']
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
                onClick={() => router.push('/practitioners')}
              >
                {t('buttons.backToList', { ns: 'common' })}
              </Button>
            }
          >
            <AlertTitle>{t('messages.practitionerDataMissing', { ns: 'practitioner' })}</AlertTitle>
            {t('messages.practitionerDetailsDataMissing', { ns: 'practitioner' })}
          </Alert>

          {/* Fallback view with modal functionality for testing */}
          <PractitionerDetailsLayout practitioner={fallbackPractitioner} />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {practitioner ? (
        <PractitionerDetailsLayout practitioner={practitioner} />
      ) : (
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            {t('notFound', { ns: 'practitioner' })}
          </Alert>
        </Box>
      )}
    </DashboardLayout>
  );
};

export default PractitionerDetailPage;
