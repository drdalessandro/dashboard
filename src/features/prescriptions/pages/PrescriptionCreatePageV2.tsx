// src/features/prescriptions/pages/PrescriptionCreatePageV2.tsx
"use client";

import React, { useCallback, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Box,
    Alert,
    CircularProgress,
    Container
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import PrescriptionFormV2 from '../components/PrescriptionFormV2';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { createLogger } from '@/utils/logger';
import { PageHeader, DataCard, ActionButton } from '@/components/designSystem';
import { useTranslation } from 'react-i18next';

// Initialize logger
const logger = createLogger('PrescriptionCreatePageV2');

// Add a props interface
interface PrescriptionCreatePageV2Props {
    initialPatientId?: string;
}

/**
 * PrescriptionCreatePageV2 Component
 * 
 * Redesigned prescription creation page that uses a form component and custom hook
 * to prevent infinite update loops and improve performance
 */
const PrescriptionCreatePageV2: React.FC<PrescriptionCreatePageV2Props> = memo(({
    initialPatientId
}) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t } = useTranslation(['prescription', 'common']);
    
    // Get patient ID from route if not provided in props
    const patientId = initialPatientId || searchParams?.get('patientId') || '';
    
    // Get network status
    const { isOffline } = useNetworkStatus?.() || { isOffline: false };
    
    // Form submission state
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [submitError, setSubmitError] = React.useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = React.useState(false);
    
    // Form submission handler
    const handleFormSubmit = useCallback(async (data: any) => {
        setIsSubmitting(true);
        setSubmitError(null);
        
        try {
            logger.info('Prescription created successfully', { id: data.id });
            setSubmitSuccess(true);
            
            // Navigate back to patient details after success
            setTimeout(() => {
                if (patientId) {
                    router.push(`/patients/show/${patientId}`);
                } else {
                    router.push('/dashboard');
                }
            }, 1500);
        } catch (error) {
            logger.error('Error handling form submission:', error);
            setSubmitError('Failed to process prescription. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }, [patientId, router]);
    
    // Handle cancel
    const handleCancel = useCallback(() => {
        if (patientId) {
            router.push(`/patients/show/${patientId}`);
        } else {
            router.push('/dashboard');
        }
    }, [patientId, router]);

    // Log initialization once
    React.useEffect(() => {
        logger.info('Prescription creation page initialized', { patientId });
    }, [patientId]);
    
    return (
        <Container maxWidth="lg" sx={{ py: 3 }}>
            {/* Page Header with design system component */}
            <PageHeader
                title={t('create.title', { ns: 'prescription' })}
                subtitle={t('create.subtitle', { ns: 'prescription' })}
                breadcrumbs={[
                    { label: t('list.title', { ns: 'prescription' }), href: '/prescriptions' },
                    { label: t('create.title', { ns: 'prescription' }) }
                ]}
                actions={
                    <ActionButton
                        variant="secondary"
                        startIcon={<ArrowBackIcon />}
                        onClick={handleCancel}
                    >
                        {t('cancel', { ns: 'common' })}
                    </ActionButton>
                }
            />

            {/* Success and Error Alerts */}
            {submitSuccess && (
                <Alert 
                    severity="success" 
                    sx={{ mb: 3 }} 
                    icon={<CheckCircleIcon fontSize="small" />}
                >
                    {t('create.success', { ns: 'prescription' })}
                </Alert>
            )}

            {submitError && (
                <Alert 
                    severity={isOffline ? "warning" : "error"} 
                    sx={{ mb: 3 }}
                >
                    {submitError}
                </Alert>
            )}

            {isOffline && !submitError && (
                <Alert 
                    severity="info" 
                    sx={{ mb: 3 }}
                    icon={<InfoIcon fontSize="small" />}
                    variant="outlined"
                >
                    {t('create.offlineMessage', { ns: 'prescription' })}
                </Alert>
            )}

            {/* Form */}
            <DataCard>
                <Box 
                    component="form" 
                    onSubmit={(e) => e.preventDefault()} // Form submit is handled by the form component's handleSubmit
                >
                    <PrescriptionFormV2 
                        initialPatientId={patientId}
                        onCancel={handleCancel}
                        onSubmit={handleFormSubmit}
                    />
                    
                    {/* Form Actions */}
                    <Box sx={{
                        mt: 3,
                        pt: 3,
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 2,
                        borderTop: '1px solid',
                        borderColor: 'divider'
                    }}>
                        <ActionButton
                            variant="secondary"
                            onClick={handleCancel}
                            disabled={isSubmitting}
                        >
                            {t('cancel', { ns: 'common' })}
                        </ActionButton>
                        <ActionButton
                            type="submit"
                            variant="primary"
                            disabled={isSubmitting}
                            startIcon={isSubmitting ? <CircularProgress size={16} /> : <SaveIcon />}
                            onClick={() => {
                                // Form's submission is triggered via document.getElementById - this is to prevent the ref forwarding issues
                                const submitBtn = document.querySelector('button[type="submit"]');
                                if (submitBtn) {
                                    submitBtn.click();
                                }
                            }}
                        >
                            {isSubmitting ? t('creating', { ns: 'prescription' }) : t('create.button', { ns: 'prescription' })}
                        </ActionButton>
                    </Box>
                </Box>
            </DataCard>
        </Container>
    );
});

PrescriptionCreatePageV2.displayName = 'PrescriptionCreatePageV2';

export default PrescriptionCreatePageV2;
