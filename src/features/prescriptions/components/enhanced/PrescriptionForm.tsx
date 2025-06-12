/**
 * Enhanced PrescriptionForm.tsx with RxNorm Integration
 * 
 * Form component for creating and editing prescription resources with RxNorm medication search
 */
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    TextField,
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
    CircularProgress,
    Chip
} from '@mui/material';
import { Grid } from '@mui/material';
import MedicationIcon from '@mui/icons-material/Medication';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import ClearIcon from '@mui/icons-material/Clear';
import InfoIcon from '@mui/icons-material/Info';
import SearchIcon from '@mui/icons-material/Search';
import WarningIcon from '@mui/icons-material/Warning';
import { DataCard, ActionButton } from '@/components/designSystem';

import { formatPatientName } from '@/features/patients/utils';
import { usePatient } from '@/hooks/usePatient';
import { createLogger } from '@/utils/logger';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { RxNormMedication, RxNormService } from '@/services/implementations/rxnorm';
import { rxNormToFHIRMedication } from '@/utils/fhir/mappers';

// Initialize logger
const logger = createLogger('EnhancedPrescriptionForm');

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

// Define duration options
const DURATION_OPTIONS = [
    '3 days',
    '5 days',
    '7 days',
    '10 days',
    '14 days',
    '30 days',
    '90 days',
    'continuous'
];

// Define form values interface
export interface PrescriptionFormValues {
    patientId: string;
    patientName?: string;
    medication?: RxNormMedication | null;
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
    medication?: string;
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

export const EnhancedPrescriptionForm: React.FC<PrescriptionFormProps> = React.memo(({
    formValues,
    setFormValues,
    errors,
    initialPatientId,
    isSubmitting = false
}) => {
    const { t } = useTranslation(['prescription', 'common']);
    const { isOffline } = useNetworkStatus?.() || { isOffline: false };
    const rxNormService = new RxNormService();

    // Medication search state
    const [medicationOptions, setMedicationOptions] = useState<RxNormMedication[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [inputValue, setInputValue] = useState('');

    // Stable patient ID reference with client-side check
    const patientId = React.useMemo(() => {
        // Ensure patient ID is only processed on the client
        if (typeof window !== 'undefined') {
            return formValues.patientId || initialPatientId || '';
        }
        return '';
    }, [formValues.patientId, initialPatientId]);

    // Fetch patient data if ID is provided
    const { data: patientData, isLoading: isPatientLoading, error: patientError } = usePatient(patientId, {
        enabled: typeof window !== 'undefined' && !!patientId,
        forceRefresh: true
    });

    // Initialize patient name only once
    React.useEffect(() => {
        if (patientData && !formValues.patientName) {
            setFormValues(prev => ({
                ...prev,
                patientName: formatPatientName(patientData)
            }));
        }
    }, [patientData, formValues.patientName, setFormValues]);

    // Handle patient loading and error states
    const patientInfoDisplay = React.useMemo(() => {
        // Ensure rendering is only done on the client
        if (typeof window === 'undefined') {
            return null;
        }

        if (isPatientLoading) {
            return (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    <Typography variant="body2">{t('common:loading.patientInfo')}</Typography>
                </Box>
            );
        }

        if (patientError) {
            return (
                <Box sx={{ color: 'error.main' }}>
                    <Typography variant="body2">
                        {t('common:errors.patientFetchFailed')}
                    </Typography>
                </Box>
            );
        }

        if (patientData) {
            return (
                <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {formatPatientName(patientData)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        ID: {patientData.id}
                    </Typography>
                </Box>
            );
        }

        return null;
    }, [isPatientLoading, patientError, patientData, t]);

    // Memoize field keys
    const fieldKeys = React.useMemo(() =>
        Object.keys(formValues) as Array<keyof PrescriptionFormValues>,
        []
    );

    // Memoize form value changes handler
    const handleChange = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
            const { name, value } = event.target;
            if (!name || !fieldKeys.includes(name as keyof PrescriptionFormValues)) return;

            const safeValue = value ?? '';
            setFormValues(prev => ({
                ...prev,
                [name]: safeValue
            }));
        },
        [fieldKeys, setFormValues]
    );

    // Handle field clearing
    const handleClearField = React.useCallback((fieldName: keyof PrescriptionFormValues) => {
        setFormValues(prev => ({
            ...prev,
            [fieldName]: ''
        }));
    }, [setFormValues]);

    // Handle medication selection with memoization
    const handleMedicationSelect = React.useCallback((medication: RxNormMedication | null) => {
        if (medication) {
            setFormValues(prev => ({
                ...prev,
                medication,
                medicationName: medication.name
            }));
        }
    }, [setFormValues]);

    // Debounced medication search - completely decoupled from the input value
    useEffect(() => {
        // Skip short queries
        if (!inputValue || inputValue.length < 3) {
            setMedicationOptions([]);
            return;
        }

        // Set up debounce timeout
        const timer = setTimeout(() => {
            // Only set the search query when the debounce timer fires
            setSearchLoading(true);
            rxNormService.searchMedications(inputValue)
                .then(results => {
                    setMedicationOptions(results);
                })
                .catch(error => {
                    logger.error('Error searching medications:', error);
                    setMedicationOptions([]);
                })
                .finally(() => {
                    setSearchLoading(false);
                });
        }, 300);

        return () => clearTimeout(timer);
    }, [inputValue, rxNormService]);

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
        <Box sx={{
            width: { xs: '100%', md: '50%' },
            mx: 'auto',
            p: { xs: 0, md: 2 },
            backgroundColor: '#fcfcfc',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            border: '1px solid',
            borderColor: 'divider'
        }}>
            {/* Patient Information */}
            <Box sx={{
                mb: 3,
                px: 3,
                pt: 3,
                pb: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <PersonIcon color="primary" sx={{ fontSize: 28 }} />
                    <Box>
                        <Typography variant="h6" sx={{ fontSize: '1.125rem', fontWeight: 600, mb: 0.5 }}>
                            {t('prescription:sections.patientInfo')}
                        </Typography>
                        {patientInfoDisplay || (
                            <TextField
                                label={t('prescription:fields.patientId')}
                                name="patientId"
                                value={formValues.patientId}
                                onChange={handleChange}
                                size="small"
                                required
                                error={!!errors.patientId}
                                helperText={errors.patientId}
                                disabled={isSubmitting}
                                sx={{ minWidth: 250 }}
                            />
                        )}
                    </Box>
                </Box>

                {/* Offline mode warning - Small indicator */}
                {isOffline && (
                    <Chip
                        icon={<InfoIcon fontSize="small" />}
                        label={t('common:offlineMode.message')}
                        color="warning"
                        size="small"
                        variant="outlined"
                    />
                )}
            </Box>

            {/* Medication Information */}
            <Box sx={{ px: 3, pb: 3 }}>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2,
                    pb: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                }}>
                    <MedicationIcon color="primary" sx={{ mr: 1.5 }} />
                    <Typography variant="h6" sx={{ fontSize: '1.125rem', fontWeight: 600 }}>
                        {t('prescription:sections.medicationInfo')}
                    </Typography>
                </Box>

                <Grid container spacing={2}>
                    {/* RxNorm Medication Search */}
                    <Grid item xs={12}>
                        <Autocomplete
                            id="medication-search"
                            freeSolo
                            options={medicationOptions}
                            getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                            onChange={(_, value) => {
                                if (typeof value !== 'string') {
                                    handleMedicationSelect(value);
                                }
                            }}
                            inputValue={inputValue}
                            onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
                            loading={searchLoading}
                            disabled={isSubmitting}
                            filterOptions={(x) => x} // Disable client-side filtering
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={t('prescription:fields.medication.search')}
                                    required
                                    variant="outlined"
                                    fullWidth
                                    error={!!errors.medicationName}
                                    helperText={errors.medicationName}
                                    InputProps={{
                                        ...params.InputProps,
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon fontSize="small" />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <>
                                                {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                {params.InputProps.endAdornment}
                                            </>
                                        ),
                                    }}
                                />
                            )}
                            renderOption={(props, option) => {
                                const { key, ...otherProps } = props;
                                return (
                                    <li key={key} {...otherProps}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                            <Typography variant="body1">{option.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {option.dosageForm && `${option.dosageForm}${option.strength ? ` | ${option.strength}` : ''}`}
                                            </Typography>
                                        </Box>
                                    </li>
                                );
                            }}
                        />

                        {/* Selected Medication Display */}
                        {formValues.medication && (
                            <Box sx={{
                                mt: 2,
                                px: 2,
                                py: 1.5,
                                bgcolor: 'rgba(3, 169, 244, 0.05)',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'primary.light'
                            }}>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>{formValues.medication.name}</Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                    {formValues.medication.rxcui && (
                                        <Chip size="small" label={`RxCUI: ${formValues.medication.rxcui}`} />
                                    )}
                                    {formValues.medication.dosageForm && (
                                        <Chip size="small" label={`Form: ${formValues.medication.dosageForm}`} color="primary" />
                                    )}
                                    {formValues.medication.activeIngredients?.length > 0 && (
                                        <Chip size="small" label={`Ingredient: ${formValues.medication.activeIngredients[0].name}`} color="secondary" />
                                    )}
                                </Box>
                            </Box>
                        )}

                        {/* Fallback Manual Entry */}
                        {!formValues.medication && (
                            <TextField
                                label={t('prescription:fields.medicationName')}
                                name="medicationName"
                                value={formValues.medicationName || ''}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={!!errors.medicationName}
                                helperText={errors.medicationName || t('prescription:fields.medication.manualEntryNote')}
                                disabled={isSubmitting}
                                sx={{ mt: 2 }}
                                size="small"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <MedicationIcon fontSize="small" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: formValues.medicationName ? (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={() => handleClearField('medicationName')} disabled={isSubmitting}>
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        </InputAdornment>
                                    ) : null
                                }}
                            />
                        )}
                    </Grid>

                    {/* Dosage, Frequency, Duration */}
                    <Grid item xs={12}>
                        <Box sx={{
                            mt: 3,
                            mb: 2,
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                {t('prescription:sections.prescriptionDetails')}
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid container spacing={2} sx={{ mb: 1 }}>
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
                                size="small"
                                InputProps={{
                                    endAdornment: formValues.dosage ? (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={() => handleClearField('dosage')} disabled={isSubmitting}>
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        </InputAdornment>
                                    ) : null
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth error={!!errors.frequency} disabled={isSubmitting} required size="small">
                                <InputLabel id="frequency-label">{t('prescription:fields.frequency')}</InputLabel>
                                <Select
                                    labelId="frequency-label"
                                    id="frequency-select"
                                    name="frequency"
                                    value={formValues.frequency || ''}
                                    onChange={handleChange}
                                    label={t('prescription:fields.frequency')}
                                    inputProps={{
                                        'data-testid': 'frequency-select',
                                        value: formValues.frequency || ''
                                    }}
                                >
                                    {FREQUENCY_OPTIONS.map(option => (
                                        <MenuItem key={option} value={option}>
                                            {t(`prescription:frequencies.${option.replace(/\s+/g, '_')}`, option)}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errors.frequency && <FormHelperText>{errors.frequency}</FormHelperText>}
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth error={!!errors.duration} disabled={isSubmitting} required size="small">
                                <InputLabel id="duration-label">{t('prescription:fields.duration')}</InputLabel>
                                <Select
                                    labelId="duration-label"
                                    id="duration-select"
                                    name="duration"
                                    value={formValues.duration || ''}
                                    onChange={handleChange}
                                    label={t('prescription:fields.duration')}
                                    inputProps={{
                                        'data-testid': 'duration-select',
                                        value: formValues.duration || ''
                                    }}
                                >
                                    {DURATION_OPTIONS.map(option => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errors.duration && <FormHelperText>{errors.duration}</FormHelperText>}
                            </FormControl>
                        </Grid>
                    </Grid>

                    {/* Quantity and Refills */}
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
                            size="small"
                            InputProps={{
                                endAdornment: formValues.quantity ? (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => handleClearField('quantity')} disabled={isSubmitting}>
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
                            size="small"
                            InputProps={{
                                endAdornment: formValues.refills && formValues.refills !== '0' ? (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => handleClearField('refills')} disabled={isSubmitting}>
                                            <ClearIcon fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                ) : null
                            }}
                        />
                    </Grid>

                    {/* Instructions */}
                    <Grid item xs={12}>
                        <TextField
                            label={t('prescription:fields.instructions')}
                            name="instructions"
                            value={formValues.instructions || ''}
                            onChange={handleChange}
                            fullWidth
                            multiline
                            rows={2}
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
                                        <IconButton size="small" onClick={() => handleClearField('instructions')} disabled={isSubmitting}>
                                            <ClearIcon fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                ) : null
                            }}
                        />
                    </Grid>
                </Grid>

                {/* Date and Status */}
                <Box sx={{
                    mt: 3,
                    pt: 2,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 2
                }}>
                    <TextField
                        label={t('prescription:fields.dateWritten')}
                        name="dateWritten"
                        type="date"
                        value={formValues.dateWritten || ''}
                        onChange={handleChange}
                        sx={{ flex: 1 }}
                        disabled={isSubmitting}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                    />

                    <FormControl sx={{ flex: 1 }} disabled={isSubmitting} size="small">
                        <InputLabel id="status-label">{t('prescription:fields.status')}</InputLabel>
                        <Select
                            labelId="status-label"
                            id="status-select"
                            name="status"
                            value={formValues.status || 'active'}
                            onChange={handleChange}
                            label={t('prescription:fields.status')}
                            inputProps={{
                                'data-testid': 'status-select',
                                value: formValues.status || 'active'
                            }}
                        >
                            <MenuItem value="active">{t('prescription:status.active')}</MenuItem>
                            <MenuItem value="draft">{t('prescription:status.draft')}</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                {/* Offline warning message */}
                {isOffline && (
                    <Typography
                        variant="body2"
                        color="warning.main"
                        sx={{ mt: 2, mb: 1, display: 'flex', alignItems: 'center', fontSize: '0.75rem' }}
                    >
                        <WarningIcon fontSize="small" sx={{ mr: 1, fontSize: '0.875rem' }} />
                        {t('prescription:offlineMode.saved')}
                    </Typography>
                )}
            </Box>
        </Box>
    );
});

export default EnhancedPrescriptionForm;