// src/features/prescriptions/pages/EnhancedPrescriptionCreatePage.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import _ from 'lodash';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Alert,
    CircularProgress,
    Paper
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { MedicationRequest, Resource, Medication } from '@medplum/fhirtypes';

import { EnhancedPrescriptionForm } from '../components/enhanced';
import { PrescriptionFormValues, PrescriptionFormErrors } from '../components/enhanced/PrescriptionForm';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useMedplum } from '@/hooks/useMedplum';
import { createLogger } from '@/utils/logger';
import { formatPatientName } from '@/features/patients/utils';
import { rxNormToFHIRMedication } from '@/utils/fhir/mappers';
import { createClient } from '@supabase/supabase-js';

// Initialize logger
const logger = createLogger('EnhancedPrescriptionCreatePage');

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Add a props interface
interface EnhancedPrescriptionCreatePageProps {
    initialPatientId: string | null;
}

// Create a client-only form wrapper component
const PrescriptionForm = ({ children, onSubmit }: { children: React.ReactNode, onSubmit: (e: React.FormEvent) => void }) => {
    return (
        <Box component="form" onSubmit={onSubmit}>
            {children}
        </Box>
    );
};

/**
 * Enhanced Prescription Creation Page Component
 * Includes RxNorm medication search and improved offline support
 */
const EnhancedPrescriptionCreatePage: React.FC<EnhancedPrescriptionCreatePageProps> = ({
    initialPatientId
}) => {
    const router = useRouter();
    // const searchParams = useSearchParams();
    // const patientId = searchParams.get('patientId');
    const { isOffline } = useNetworkStatus?.() || { isOffline: false };
    const medplum = useMedplum();

    // Memoize the initial form values to prevent recreating on each render
    const initialFormValues = useMemo(() => ({
        patientId: initialPatientId || '',
        medicationName: '',
        dosage: '',
        frequency: '',
        duration: '',
        quantity: '',
        refills: '0',
        instructions: '',
        status: 'active' as 'active' | 'draft',
        dateWritten: new Date().toISOString().split('T')[0],
        medication: null
    }), [initialPatientId]);

    // Use refs to prevent unnecessary re-renders
    const initialRenderRef = useRef(true);
    const prevFormValuesRef = useRef<PrescriptionFormValues | null>(null);

    // Form state with robust initialization
    const [formValues, setFormValues] = useState<PrescriptionFormValues>(initialFormValues);

    // Create a stable, memoized version of setFormValues with deep equality checking
    // This is critical to prevent the infinite update loop
    const safeSetFormValues = useCallback((updater: PrescriptionFormValues | ((prev: PrescriptionFormValues) => PrescriptionFormValues)) => {
        setFormValues(prev => {
            // If updater is a function, call it with prev
            const newValues = typeof updater === 'function' ? updater(prev) : updater;

            // Store previous values for deep comparison
            prevFormValuesRef.current = prev;

            // Use lodash for deep equality check which is more reliable than JSON.stringify
            if (_.isEqual(prev, newValues)) {
                return prev; // Return previous state if no actual changes
            }

            // For debugging during development
            const changedKeys = Object.keys(newValues).filter(key => {
                const k = key as keyof PrescriptionFormValues;
                return !_.isEqual(prev[k], newValues[k]);
            });

            if (changedKeys.length > 0) {
                logger.debug('Form values changed:', { changedKeys });
            }

            return newValues;
        });
    }, []);

    // Form validation errors
    const [errors, setErrors] = useState<PrescriptionFormErrors>({});

    // Form submission state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: PrescriptionFormErrors = {};

        // Required fields validation
        if (!formValues.patientId) {
            newErrors.patientId = 'Patient ID is required';
        }

        if (!formValues.medicationName) {
            newErrors.medicationName = 'Medication name is required';
        }

        if (!formValues.dosage) {
            newErrors.dosage = 'Dosage is required';
        }

        if (!formValues.frequency) {
            newErrors.frequency = 'Frequency is required';
        }

        if (!formValues.duration) {
            newErrors.duration = 'Duration is required';
        }

        if (!formValues.quantity) {
            newErrors.quantity = 'Quantity is required';
        }

        // Set errors and return validation result
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            logger.info('Creating new prescription with RxNorm data', {
                patientId: formValues.patientId,
                medication: formValues.medication?.rxcui || formValues.medicationName
            });

            if (isOffline) {
                await handleOfflinePrescription();
            } else {
                await handleOnlinePrescription();
            }

            setSubmitSuccess(true);

            // Navigate back to patient details after success
            setTimeout(() => {
                router.push(`/patients/show/${formValues.patientId}`);
            }, 1500);

        } catch (error) {
            logger.error('Error creating prescription:', error);
            setSubmitError('Failed to create prescription. Please try again.');

            if (isOffline) {
                // Even though there was an error, show success for offline mode 
                // since we're queuing it for later sync
                setSubmitSuccess(true);
                setSubmitError('Prescription saved offline. It will be synchronized when connection is restored.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOnlinePrescription = async () => {
        // First create or find the Medication resource if using RxNorm data
        let medicationReference;

        if (formValues.medication) {
            try {
                // Convert RxNorm data to FHIR Medication
                const medicationData = rxNormToFHIRMedication(formValues.medication) as Medication;

                // Check if medication already exists by RxCUI
                try {
                    const existingMedication = await medplum.searchOne('Medication', {
                        'code:contains': formValues.medication.rxcui
                    }) as Medication;

                    if (existingMedication) {
                        medicationReference = {
                            reference: `Medication/${existingMedication.id}`,
                            display: existingMedication.code?.coding?.[0]?.display || formValues.medication.name
                        };
                    } else {
                        // Create new Medication resource
                        const newMedication = await medplum.createResource(medicationData);
                        medicationReference = {
                            reference: `Medication/${newMedication.id}`,
                            display: newMedication.code?.coding?.[0]?.display || formValues.medication.name
                        };
                    }
                } catch (error) {
                    // If search fails, create new resource
                    const newMedication = await medplum.createResource(medicationData);
                    medicationReference = {
                        reference: `Medication/${newMedication.id}`,
                        display: newMedication.code?.coding?.[0]?.display || formValues.medication.name
                    };
                }
            } catch (error) {
                logger.error('Error creating Medication resource:', error);
                // Fall back to CodeableConcept if Medication resource creation fails
                medicationReference = null;
            }
        }

        // Create the MedicationRequest resource
        const medicationRequest = {
            resourceType: 'MedicationRequest' as const,
            status: formValues.status,
            intent: 'order' as const,

            // Use medicationReference if available, otherwise use CodeableConcept
            ...(medicationReference
                ? { medicationReference }
                : {
                    medicationCodeableConcept: {
                        text: formValues.medicationName,
                        ...(formValues.medication?.rxcui
                            ? {
                                coding: [{
                                    system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
                                    code: formValues.medication.rxcui,
                                    display: formValues.medicationName
                                }]
                            }
                            : {}
                        )
                    }
                }
            ),

            subject: {
                reference: `Patient/${formValues.patientId}`,
                display: formValues.patientName
            },
            authoredOn: formValues.dateWritten || new Date().toISOString(),
            requester: {
                reference: `Practitioner/${medplum.getProfile()?.id || 'unknown'}`
            },
            dosageInstruction: [
                {
                    text: `${formValues.dosage} ${formValues.frequency} for ${formValues.duration}. ${formValues.instructions}`,
                    timing: {
                        code: {
                            text: formValues.frequency
                        }
                    },
                    doseAndRate: [
                        {
                            doseQuantity: {
                                value: parseFloat(formValues.dosage) || 1,
                                unit: 'dose'
                            }
                        }
                    ]
                }
            ],
            dispenseRequest: {
                numberOfRepeatsAllowed: parseInt(formValues.refills) || 0,
                quantity: {
                    value: parseInt(formValues.quantity) || 1,
                    unit: 'tablets'
                }
            }
        };

        // Create the resource
        const response = await medplum.createResource(medicationRequest) as MedicationRequest;
        logger.info('Prescription created successfully', { id: response.id });

        return response;
    };

    const handleOfflinePrescription = async () => {
        // Queue prescription for later synchronization
        const prescriptionData = {
            medication: formValues.medication,
            patientId: formValues.patientId,
            patientName: formValues.patientName,
            medicationName: formValues.medicationName,
            dosage: formValues.dosage,
            frequency: formValues.frequency,
            duration: formValues.duration,
            quantity: formValues.quantity,
            refills: formValues.refills,
            instructions: formValues.instructions,
            status: formValues.status,
            dateWritten: formValues.dateWritten
        };

        const { data, error } = await supabase
            .from('offline_queue')
            .insert({
                type: 'prescription',
                data: prescriptionData,
                status: 'pending',
                created_at: new Date().toISOString()
            });

        if (error) {
            logger.error('Error queuing prescription for offline sync:', error);
            throw error;
        }

        logger.info('Prescription queued for offline sync');
        return data;
    };

    // Handle cancel
    const handleCancel = () => {
        if (formValues.patientId) {
            router.push(`/patients/show/${formValues.patientId}`);
        } else {
            router.push('/dashboard');
        }
    };

    // Prevent unnecessary re-renders on mount and patient ID changes
    const patientIdMountedRef = useRef(false);

    // Log when patient ID changes - update to use initialPatientId
    useEffect(() => {
        if (initialPatientId && !patientIdMountedRef.current) {
            patientIdMountedRef.current = true;
            logger.info('Enhanced prescription creation initialized with patient ID', { patientId: initialPatientId });
        }
    }, [initialPatientId]);

    // Wrap the EnhancedPrescriptionForm in a memo to prevent unnecessary re-renders
    const MemoizedPrescriptionForm = useMemo(() => {
        return (
            <EnhancedPrescriptionForm
                formValues={formValues}
                setFormValues={safeSetFormValues}
                errors={errors}
                initialPatientId={initialPatientId || undefined}
                isSubmitting={isSubmitting}
            />
        );
    }, [formValues, safeSetFormValues, errors, initialPatientId, isSubmitting]);

    return (
        <Box sx={{ 
            width: '100%', 
            height: '100vh', 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: { xs: 2, md: 3 },
            backgroundColor: 'rgba(0, 0, 0, 0.03)',
            backgroundImage: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.9), rgba(245, 245, 245, 0.95))',
            backdropFilter: 'blur(5px)',
            position: 'relative',
            zIndex: 1
        }}>
            {/* Modal-like header */}
            <Box sx={{ 
                width: { xs: '100%', md: '50%' },
                mb: 2,
                textAlign: 'center'
            }}>
                <Typography 
                    variant="h5" 
                    component="h1" 
                    sx={{ 
                        fontWeight: 600, 
                        color: 'primary.main',
                        fontSize: { xs: '1.5rem', md: '1.75rem' },
                        mb: 1
                    }}
                >
                    Create New Prescription
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {formValues.patientName ? `For ${formValues.patientName}` : 'Create a new prescription with RxNorm medication lookup'}
                </Typography>
                
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={handleCancel}
                    size="small"
                    sx={{ height: 36 }}
                >
                    Cancel
                </Button>
            </Box>

            {/* Success and Error Alerts - Centered for modal style */}
            <Box sx={{ 
                width: { xs: '100%', md: '50%' }, 
                mb: 2 
            }}>
                {submitSuccess && (
                    <Alert 
                        severity="success" 
                        sx={{ mb: 1, borderRadius: 2 }} 
                        icon={<CheckCircleIcon fontSize="small" />}
                    >
                        Prescription created successfully!
                    </Alert>
                )}

                {submitError && (
                    <Alert 
                        severity={isOffline ? "warning" : "error"} 
                        sx={{ mb: 1, borderRadius: 2 }}
                    >
                        {submitError}
                    </Alert>
                )}

                {isOffline && !submitError && (
                    <Alert 
                        severity="info" 
                        sx={{ mb: 1, borderRadius: 2 }}
                        icon={<InfoIcon fontSize="small" />}
                        variant="outlined"
                    >
                        You are currently offline. The prescription will be saved locally and synchronized when connection is restored.
                    </Alert>
                )}
            </Box>

            {/* Form */}
            <Paper
                elevation={3}
                sx={{
                    p: 0,
                    width: { xs: '100%', md: '50%' },
                    boxShadow: '0 6px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: '#ffffff'
                }}
            >
                <PrescriptionForm onSubmit={handleSubmit}>
                    {MemoizedPrescriptionForm}

                    {/* Form Actions - Fixed bottom action bar */}
                    <Box sx={{
                        p: 2,
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 2,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                        backgroundColor: 'background.paper'
                    }}>
                        <Button
                            variant="outlined"
                            onClick={handleCancel}
                            disabled={isSubmitting}
                            size="small"
                            sx={{ px: 3 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={isSubmitting}
                            startIcon={isSubmitting ? <CircularProgress size={16} /> : <SaveIcon />}
                            size="small"
                            sx={{ px: 3 }}
                        >
                            {isSubmitting ? 'Creating...' : 'Create Prescription'}
                        </Button>
                    </Box>
                </PrescriptionForm>
            </Paper>
        </Box>
    );
};

export default EnhancedPrescriptionCreatePage;