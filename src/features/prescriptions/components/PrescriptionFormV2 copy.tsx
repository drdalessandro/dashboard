/**
 * PrescriptionFormV2.tsx
 * 
 * Rewritten prescription form component with clean architecture to prevent infinite loops
 * Uses react-hook-form for form state management and proper optimization
 */
import React, { memo } from 'react';
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
    InputAdornment,
    IconButton,
    Autocomplete,
    CircularProgress,
    Chip,
    Paper
} from '@mui/material';
import { Grid } from '@mui/material';
import MedicationIcon from '@mui/icons-material/Medication';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ClearIcon from '@mui/icons-material/Clear';
import InfoIcon from '@mui/icons-material/Info';
import SearchIcon from '@mui/icons-material/Search';
import WarningIcon from '@mui/icons-material/Warning';

import { formatPatientName } from '@/features/patients/utils';
import { 
    usePrescriptionForm, 
    FREQUENCY_OPTIONS, 
    DURATION_OPTIONS 
} from '../hooks/usePrescriptionForm';
import { RxNormMedication } from '@/services/implementations/rxnorm';

// Define form props
export interface PrescriptionFormV2Props {
    initialPatientId?: string;
    onCancel?: () => void;
    onSubmit?: (data: any) => void;
}

// Create a simple button for clearing fields
const ClearButton = memo(({ onClick, disabled }: { onClick: () => void, disabled?: boolean }) => (
    <InputAdornment position="end">
        <IconButton size="small" onClick={onClick} disabled={disabled}>
            <ClearIcon fontSize="small" />
        </IconButton>
    </InputAdornment>
));

/**
 * PrescriptionFormV2 component
 * Completely rewritten to use react-hook-form and prevent infinite loops
 */
const PrescriptionFormV2: React.FC<PrescriptionFormV2Props> = memo(({
    initialPatientId,
    onCancel,
    onSubmit
}) => {
    const { t } = useTranslation(['prescription', 'common']);
    
    // Use our custom hook for form state management
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        errors,
        isSubmitting,
        submitError,
        submitSuccess,
        patientData,
        isPatientLoading,
        searchTerm,
        setSearchTerm,
        medicationOptions,
        searchLoading,
        handleMedicationSelect,
        isOffline
    } = usePrescriptionForm({
        initialPatientId,
        onSuccess: onSubmit
    });
    
    // Watch form values needed for UI
    const medicationName = watch('medicationName');
    const medication = watch('medication');
    const patientId = watch('patientId');
    const dosage = watch('dosage');
    const instructions = watch('instructions');
    const frequency = watch('frequency');
    const duration = watch('duration');
    const quantity = watch('quantity');
    const refills = watch('refills');
    
    // Clear field helper
    const clearField = (field: string) => {
        setValue(field as any, '');
    };
    
    // Patient info display
    const patientInfoDisplay = React.useMemo(() => {
        if (isPatientLoading) {
            return (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    <Typography variant="body2">{t('common:loading.patientInfo')}</Typography>
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
    }, [isPatientLoading, patientData, t]);
    
    return (
        <Paper
            elevation={0}
            sx={{
                width: '100%',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '8px',
                overflow: 'hidden'
            }}
        >
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
                                {...register('patientId')}
                                size="small"
                                required
                                error={!!errors.patientId}
                                helperText={errors.patientId?.message}
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
                            inputValue={searchTerm}
                            onInputChange={(_, newInputValue) => setSearchTerm(newInputValue)}
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
                                    helperText={errors.medicationName?.message}
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
                                    <li key={option.rxcui || option.name} {...otherProps}>
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
                        {medication && (
                            <Box sx={{
                                mt: 2,
                                px: 2,
                                py: 1.5,
                                bgcolor: 'rgba(3, 169, 244, 0.05)',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'primary.light'
                            }}>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>{medication.name}</Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                    {medication.rxcui && (
                                        <Chip size="small" label={`RxCUI: ${medication.rxcui}`} />
                                    )}
                                    {medication.dosageForm && (
                                        <Chip size="small" label={`Form: ${medication.dosageForm}`} color="primary" />
                                    )}
                                    {medication.activeIngredients?.length > 0 && (
                                        <Chip size="small" label={`Ingredient: ${medication.activeIngredients[0].name}`} color="secondary" />
                                    )}
                                </Box>
                            </Box>
                        )}

                        {/* Fallback Manual Entry */}
                        {!medication && (
                            <TextField
                                label={t('prescription:fields.medicationName')}
                                {...register('medicationName')}
                                fullWidth
                                required
                                error={!!errors.medicationName}
                                helperText={errors.medicationName?.message || t('prescription:fields.medication.manualEntryNote')}
                                disabled={isSubmitting}
                                sx={{ mt: 2 }}
                                size="small"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <MedicationIcon fontSize="small" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: medicationName ? (
                                        <ClearButton 
                                            onClick={() => clearField('medicationName')} 
                                            disabled={isSubmitting} 
                                        />
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

                    <Grid container item spacing={2} sx={{ mb: 1 }}>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                label={t('prescription:fields.dosage')}
                                {...register('dosage')}
                                fullWidth
                                required
                                error={!!errors.dosage}
                                helperText={errors.dosage?.message}
                                disabled={isSubmitting}
                                size="small"
                                InputProps={{
                                    endAdornment: dosage ? (
                                        <ClearButton 
                                            onClick={() => clearField('dosage')} 
                                            disabled={isSubmitting}
                                        />
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
                                    label={t('prescription:fields.frequency')}
                                    value={frequency || ''}
                                    onChange={(e) => setValue('frequency', e.target.value)}
                                >
                                    {FREQUENCY_OPTIONS.map(option => (
                                        <MenuItem key={option} value={option}>
                                            {t(`prescription:frequencies.${option.replace(/\s+/g, '_')}`, option)}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errors.frequency && <FormHelperText>{errors.frequency.message}</FormHelperText>}
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth error={!!errors.duration} disabled={isSubmitting} required size="small">
                                <InputLabel id="duration-label">{t('prescription:fields.duration')}</InputLabel>
                                <Select
                                    labelId="duration-label"
                                    id="duration-select"
                                    label={t('prescription:fields.duration')}
                                    value={duration || ''}
                                    onChange={(e) => setValue('duration', e.target.value)}
                                >
                                    {DURATION_OPTIONS.map(option => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errors.duration && <FormHelperText>{errors.duration.message}</FormHelperText>}
                            </FormControl>
                        </Grid>
                    </Grid>

                    {/* Quantity and Refills */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label={t('prescription:fields.quantity')}
                            {...register('quantity')}
                            fullWidth
                            required
                            error={!!errors.quantity}
                            helperText={errors.quantity?.message}
                            disabled={isSubmitting}
                            type="number"
                            size="small"
                            InputProps={{
                                endAdornment: quantity ? (
                                    <ClearButton 
                                        onClick={() => clearField('quantity')} 
                                        disabled={isSubmitting}
                                    />
                                ) : null
                            }}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            label={t('prescription:fields.refills')}
                            {...register('refills')}
                            fullWidth
                            error={!!errors.refills}
                            helperText={errors.refills?.message}
                            disabled={isSubmitting}
                            type="number"
                            size="small"
                            InputProps={{
                                endAdornment: refills && refills !== '0' ? (
                                    <ClearButton 
                                        onClick={() => clearField('refills')} 
                                        disabled={isSubmitting}
                                    />
                                ) : null
                            }}
                        />
                    </Grid>

                    {/* Instructions */}
                    <Grid item xs={12}>
                        <TextField
                            label={t('prescription:fields.instructions')}
                            {...register('instructions')}
                            fullWidth
                            multiline
                            rows={2}
                            error={!!errors.instructions}
                            helperText={errors.instructions?.message}
                            disabled={isSubmitting}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <DescriptionIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                                endAdornment: instructions ? (
                                    <ClearButton 
                                        onClick={() => clearField('instructions')} 
                                        disabled={isSubmitting}
                                    />
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
                        {...register('dateWritten')}
                        type="date"
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
                            label={t('prescription:fields.status')}
                            value={watch('status') || 'active'}
                            onChange={(e) => setValue('status', e.target.value as 'active' | 'draft')}
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
        </Paper>
    );
});

export default PrescriptionFormV2;