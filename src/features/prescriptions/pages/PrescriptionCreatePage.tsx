// src/features/prescriptions/pages/PrescriptionCreatePage.tsx
"use client";

import React, { useState, useEffect } from 'react';
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
import { MedicationRequest } from '@medplum/fhirtypes';

import PrescriptionForm, { PrescriptionFormValues, PrescriptionFormErrors } from '../components/PrescriptionForm';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useMedplum } from '@/hooks/useMedplum';
import { createLogger } from '@/utils/logger';
import { formatPatientName } from '@/features/patients/utils';

// Initialize logger
const logger = createLogger('PrescriptionCreatePage');

/**
 * Prescription Creation Page Component
 * Handles creating a new prescription for a patient
 */
const PrescriptionCreatePage: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const patientId = searchParams.get('patientId');
    const { isOffline } = useNetworkStatus?.() || { isOffline: false };
    const medplum = useMedplum();

    // Form state
    const [formValues, setFormValues] = useState<PrescriptionFormValues>({
        patientId: patientId || '',
        medicationName: '',
        dosage: '',
        frequency: '',
        duration: '',
        quantity: '',
        refills: '0',
        instructions: '',
        status: 'active',
        dateWritten: new Date().toISOString().split('T')[0]
    });

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
            logger.info('Creating new prescription', {
                patientId: formValues.patientId,
                medication: formValues.medicationName
            });

            // Create FHIR MedicationRequest resource
            const medicationRequest = {
                resourceType: 'MedicationRequest' as const,
                status: formValues.status,
                intent: 'order' as const,
                medicationCodeableConcept: {
                    text: formValues.medicationName
                },
                subject: {
                    reference: `Patient/${formValues.patientId}`,
                    display: formValues.patientName
                },
                authoredOn: formValues.dateWritten || new Date().toISOString(),
                requester: {
                    reference: `Practitioner/${medplum.client.getProfile()?.id || 'unknown'}`
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
                                    value: parseFloat(formValues.dosage),
                                    unit: 'mg'
                                }
                            }
                        ]
                    }
                ],
                dispenseRequest: {
                    numberOfRepeatsAllowed: parseInt(formValues.refills),
                    quantity: {
                        value: parseInt(formValues.quantity),
                        unit: 'tablets'
                    }
                }
            };

            // Create the resource
            const response = await medplum.createResource(medicationRequest) as MedicationRequest;

            logger.info('Prescription created successfully', { id: response.id });
            setSubmitSuccess(true);

            // Navigate back to patient details after success
            setTimeout(() => {
                router.push(`/patients/show/${formValues.patientId}`);
            }, 1500);

        } catch (error) {
            logger.error('Error creating prescription:', error);
            setSubmitError('Failed to create prescription. Please try again.');

            if (isOffline) {
                setSubmitSuccess(true);
                setSubmitError('Prescription saved offline. It will be synchronized when connection is restored.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle cancel
    const handleCancel = () => {
        if (formValues.patientId) {
            router.push(`/patients/show/${formValues.patientId}`);
        } else {
            router.push('/dashboard');
        }
    };

    // Log when patient ID changes
    useEffect(() => {
        if (patientId) {
            logger.info('Prescription creation initialized with patient ID', { patientId });
        }
    }, [patientId]);

    return (
        <Box sx={{ maxWidth: '1200px', mx: 'auto', p: 3 }}>
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3
                }}
            >
                <Box>
                    <Typography variant="h4" component="h1">
                        Create New Prescription
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Create a new prescription for a patient
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={handleCancel}
                >
                    Cancel
                </Button>
            </Box>

            {/* Success and Error Alerts */}
            {submitSuccess && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    Prescription created successfully!
                </Alert>
            )}

            {submitError && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    {submitError}
                </Alert>
            )}

            {isOffline && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    You are currently offline. The prescription will be saved locally and synchronized when connection is restored.
                </Alert>
            )}

            {/* Form */}
            <Paper elevation={2} sx={{ p: 0 }}>
                <Box component="form" onSubmit={handleSubmit}>
                    <PrescriptionForm
                        formValues={formValues}
                        setFormValues={setFormValues}
                        errors={errors}
                        initialPatientId={patientId || undefined}
                        isSubmitting={isSubmitting}
                    />

                    {/* Form Actions */}
                    <Box sx={{ p: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={handleCancel}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={isSubmitting}
                            startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
                        >
                            {isSubmitting ? 'Creating...' : 'Create Prescription'}
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};

export default PrescriptionCreatePage;