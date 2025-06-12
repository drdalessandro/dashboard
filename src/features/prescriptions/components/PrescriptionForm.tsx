/**
 * PrescriptionForm.tsx
 * 
 * Form component for creating and editing prescription resources
 * Following the same patterns as PatientForm
 */
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    TextField,
    Card,
    CardContent,
    CardHeader,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    Divider,
    InputAdornment,
    IconButton,
    SelectChangeEvent,
    Autocomplete,
    CircularProgress
} from '@mui/material';
import { Grid } from '@mui/material';
import MedicationIcon from '@mui/icons-material/Medication';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import ClearIcon from '@mui/icons-material/Clear';
import { PrescriptionCreateParams } from '../types/prescription.types';
import { formatPatientName } from '@/features/patients/utils';
import { usePatient } from '@/hooks/usePatient';
import { createLogger } from '@/utils/logger';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

// Initialize logger
const logger = createLogger('PrescriptionForm');

// Define frequency options
const FREQUENCY_OPTIONS = [
    'once daily',
    'twice daily',
    'three times daily',
    'four times daily',
    'every morning',
    'every evening',
    'every 4 hours',
    'every 6 hours',
    'every 8 hours',
    'every 12 hours',
    'as needed',
    'with meals',
    'after meals',
    'before meals',
    'at bedtime'
];

// Define form values interface
export interface PrescriptionFormValues {
    patientId: string;
    patientName?: string;
    medicationName: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: string;
    refills: string;
    instructions: string;
    status: 'active' | 'draft';
    dateWritten?: string;
    prescriberId?: string;
    prescriberName?: string;
}

// Define form errors interface
export interface PrescriptionFormErrors {
    patientId?: string;
    medicationName?: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    quantity?: string;
    refills?: string;
    instructions?: string;
}

export interface PrescriptionFormProps {
    formValues: PrescriptionFormValues;
    setFormValues: React.Dispatch<React.SetStateAction<PrescriptionFormValues>>;
    errors: PrescriptionFormErrors;
    initialPatientId?: string;
    isSubmitting?: boolean;
}

export const PrescriptionForm: React.FC<PrescriptionFormProps> = React.memo(({
    formValues,
    setFormValues,
    errors,
    initialPatientId,
    isSubmitting = false
}) => {
    const { t } = useTranslation(['prescription', 'common']);
    const { isOffline } = useNetworkStatus?.() || { isOffline: false };

    // Fetch patient data if ID is provided
    const patientResponse = usePatient(formValues.patientId, {
        enabled: !!formValues.patientId
    });

    // Handle changes for all input types with improved type safety
    const fieldKeys = React.useMemo(() =>
        Object.keys(formValues) as Array<keyof PrescriptionFormValues>,
        []
    );

    const handleChange = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
            const { name, value } = event.target;

            if (!name) return;

            // Don't update if the name isn't a valid key
            if (!fieldKeys.includes(name as any)) return;

            // Don't update if the value hasn't changed
            if (formValues[name as keyof PrescriptionFormValues] === value) return;

            // Use a callback form of setState to ensure we're not causing unwanted re-renders
            setFormValues(prev => ({
                ...prev,
                [name]: value
            }));
        },
        [fieldKeys, formValues, setFormValues]
    );

    // Handle field clearing
    const handleClearField = React.useCallback((fieldName: keyof PrescriptionFormValues) => {
        setFormValues(prev => ({
            ...prev,
            [fieldName]: ''
        }));
    }, [setFormValues]);

    // Set patient name when patient data is loaded
    useEffect(() => {
        if (patientResponse.data && !formValues.patientName) {
            setFormValues(prev => ({
                ...prev,
                patientName: formatPatientName(patientResponse.data!)
            }));
        }
    }, [patientResponse.data, formValues.patientName, setFormValues]);

    // Initialize form with defaults
    const initialRenderRef = useRef(true);
    useEffect(() => {
        if (initialRenderRef.current) {
            initialRenderRef.current = false;

            // Set today's date as default if not provided
            if (!formValues.dateWritten) {
                const today = new Date().toISOString().split('T')[0];
                setFormValues(prev => ({
                    ...prev,
                    dateWritten: today
                }));
            }

            // Set status to active if not provided
            if (!formValues.status) {
                setFormValues(prev => ({
                    ...prev,
                    status: 'active'
                }));
            }
        }
    }, [formValues.dateWritten, formValues.status, setFormValues]);

    return (
        <>
            {/* Patient Information Card */}
            <Card sx={{ mb: 3 }}>
                <CardHeader
                    title={t('prescription:sections.patientInfo')}
                    titleTypographyProps={{ variant: 'h6' }}
                    avatar={<PersonIcon color="primary" />}
                />
                <Divider />
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            {patientResponse.isLoading ? (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <CircularProgress size={20} sx={{ mr: 1 }} />
                                    <Typography>{t('common:loading.patientInfo')}</Typography>
                                </Box>
                            ) : patientResponse.data ? (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body1">
                                        <strong>{t('prescription:fields.patient')}:</strong> {formatPatientName(patientResponse.data)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        ID: {patientResponse.data.id}
                                    </Typography>
                                </Box>
                            ) : (
                                <TextField
                                    label={t('prescription:fields.patientId')}
                                    name="patientId"
                                    value={formValues.patientId}
                                    onChange={handleChange}
                                    fullWidth
                                    required
                                    error={!!errors.patientId}
                                    helperText={errors.patientId}
                                    disabled={isSubmitting}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PersonIcon fontSize="small" />
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            )}
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Medication Information Card */}
            <Card sx={{ mb: 3 }}>
                <CardHeader
                    title={t('prescription:sections.medicationInfo')}
                    titleTypographyProps={{ variant: 'h6' }}
                    avatar={<MedicationIcon color="primary" />}
                />
                <Divider />
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                label={t('prescription:fields.medicationName')}
                                name="medicationName"
                                value={formValues.medicationName || ''}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={!!errors.medicationName}
                                helperText={errors.medicationName}
                                disabled={isSubmitting}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <MedicationIcon fontSize="small" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: formValues.medicationName ? (
                                        <InputAdornment position="end">
                                            <IconButton
                                                size="small"
                                                aria-label="clear"
                                                onClick={() => handleClearField('medicationName')}
                                                disabled={isSubmitting}
                                            >
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        </InputAdornment>
                                    ) : null
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <TextField
                                label={t('prescription:fields.dosage')}
                                name="dosage"
                                value={formValues.dosage || ''}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={!!errors.dosage}
                                helperText={errors.dosage}
                                disabled={isSubmitting}
                                InputProps={{
                                    endAdornment: formValues.dosage ? (
                                        <InputAdornment position="end">
                                            <IconButton
                                                size="small"
                                                aria-label="clear"
                                                onClick={() => handleClearField('dosage')}
                                                disabled={isSubmitting}
                                            >
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        </InputAdornment>
                                    ) : null
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <FormControl
                                fullWidth
                                error={!!errors.frequency}
                                disabled={isSubmitting}
                            >
                                <InputLabel>{t('prescription:fields.frequency')}</InputLabel>
                                <Select
                                    name="frequency"
                                    value={formValues.frequency || ''}
                                    onChange={handleChange}
                                    label={t('prescription:fields.frequency')}
                                >
                                    {FREQUENCY_OPTIONS.map(option => (
                                        <MenuItem key={option} value={option}>
                                            {t(`prescription:frequencies.${option.replace(/\s+/g, '_')}`, option)}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errors.frequency && (
                                    <FormHelperText>{errors.frequency}</FormHelperText>
                                )}
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <TextField
                                label={t('prescription:fields.duration')}
                                name="duration"
                                value={formValues.duration || ''}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={!!errors.duration}
                                helperText={errors.duration}
                                disabled={isSubmitting}
                                InputProps={{
                                    endAdornment: formValues.duration ? (
                                        <InputAdornment position="end">
                                            <IconButton
                                                size="small"
                                                aria-label="clear"
                                                onClick={() => handleClearField('duration')}
                                                disabled={isSubmitting}
                                            >
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        </InputAdornment>
                                    ) : null
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                label={t('prescription:fields.quantity')}
                                name="quantity"
                                value={formValues.quantity || ''}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={!!errors.quantity}
                                helperText={errors.quantity}
                                disabled={isSubmitting}
                                type="number"
                                InputProps={{
                                    endAdornment: formValues.quantity ? (
                                        <InputAdornment position="end">
                                            <IconButton
                                                size="small"
                                                aria-label="clear"
                                                onClick={() => handleClearField('quantity')}
                                                disabled={isSubmitting}
                                            >
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        </InputAdornment>
                                    ) : null
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                label={t('prescription:fields.refills')}
                                name="refills"
                                value={formValues.refills || '0'}
                                onChange={handleChange}
                                fullWidth
                                error={!!errors.refills}
                                helperText={errors.refills}
                                disabled={isSubmitting}
                                type="number"
                                InputProps={{
                                    endAdornment: formValues.refills && formValues.refills !== '0' ? (
                                        <InputAdornment position="end">
                                            <IconButton
                                                size="small"
                                                aria-label="clear"
                                                onClick={() => handleClearField('refills')}
                                                disabled={isSubmitting}
                                            >
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        </InputAdornment>
                                    ) : null
                                }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                label={t('prescription:fields.instructions')}
                                name="instructions"
                                value={formValues.instructions || ''}
                                onChange={handleChange}
                                fullWidth
                                multiline
                                rows={3}
                                error={!!errors.instructions}
                                helperText={errors.instructions}
                                disabled={isSubmitting}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <DescriptionIcon fontSize="small" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: formValues.instructions ? (
                                        <InputAdornment position="end">
                                            <IconButton
                                                size="small"
                                                aria-label="clear"
                                                onClick={() => handleClearField('instructions')}
                                                disabled={isSubmitting}
                                            >
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        </InputAdornment>
                                    ) : null
                                }}
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Prescription Details Card */}
            <Card sx={{ mb: 3 }}>
                <CardHeader
                    title={t('prescription:sections.prescriptionDetails')}
                    titleTypographyProps={{ variant: 'h6' }}
                    avatar={<LocalHospitalIcon color="primary" />}
                />
                <Divider />
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label={t('prescription:fields.dateWritten')}
                                name="dateWritten"
                                type="date"
                                value={formValues.dateWritten || ''}
                                onChange={handleChange}
                                fullWidth
                                disabled={isSubmitting}
                                InputLabelProps={{ shrink: true }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <CalendarTodayIcon fontSize="small" />
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl
                                fullWidth
                                disabled={isSubmitting}
                            >
                                <InputLabel>{t('prescription:fields.status')}</InputLabel>
                                <Select
                                    name="status"
                                    value={formValues.status || 'active'}
                                    onChange={handleChange}
                                    label={t('prescription:fields.status')}
                                >
                                    <MenuItem value="active">{t('prescription:status.active')}</MenuItem>
                                    <MenuItem value="draft">{t('prescription:status.draft')}</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {isOffline && (
                <Typography
                    variant="body2"
                    color="warning.main"
                    sx={{ mt: 2, mb: 2, display: 'flex', alignItems: 'center' }}
                >
                    <IconButton size="small" color="warning" sx={{ mr: 1 }}>
                        <MedicationIcon fontSize="small" />
                    </IconButton>
                    {t('common:offlineMode.message')} {t('prescription:offlineMode.saved')}
                </Typography>
            )}
        </>
    );
});

export default PrescriptionForm;