/**
 * FHIRForm
 * Standardized form component for FHIR resources
 * Optimized for healthcare data entry in low-connectivity environments
 */

import React from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  AlertTitle,
  Divider
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  Save as SaveIcon,
  CloudOff as CloudOffIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { Resource } from '@medplum/fhirtypes';
import { useTranslation } from 'react-i18next';
import { useSyncStatus } from '../../hooks/common/useSyncStatus';
import { useMediaQuery } from '../../hooks/common/useMediaQuery';

interface FHIRFormProps {
  /**
   * FHIR resource being edited
   */
  resource?: Resource;

  /**
   * Title of the form
   */
  title: string;

  /**
   * Whether the form is in create mode (vs edit mode)
   */
  isCreate?: boolean;

  /**
   * Whether the form is submitting
   */
  isSubmitting?: boolean;

  /**
   * Form error message
   */
  error?: string;

  /**
   * Handler for form submission
   */
  onSubmit: (e: React.FormEvent) => void;

  /**
   * Handler for form cancellation
   */
  onCancel?: () => void;

  /**
   * Custom save button text
   */
  saveButtonText?: string;

  /**
   * Whether the form has been modified
   */
  isDirty?: boolean;

  /**
   * Whether form validation has passed
   */
  isValid?: boolean;

  /**
   * Section titles and components
   */
  sections: Array<{
    title: string;
    description?: string;
    component: React.ReactNode;
  }>;

  /**
   * Additional buttons to render in the form footer
   */
  additionalButtons?: React.ReactNode;

  /**
   * Whether the form is in view-only mode
   */
  readOnly?: boolean;
}

/**
 * Standardized form component for FHIR resources
 * Provides consistent form layout and behavior across the application
 */
export const FHIRForm: React.FC<FHIRFormProps> = ({
  resource,
  title,
  isCreate = false,
  isSubmitting = false,
  error,
  onSubmit,
  onCancel,
  saveButtonText,
  isDirty = false,
  isValid = true,
  sections,
  additionalButtons,
  readOnly = false
}) => {
  const { t } = useTranslation(['practitioner', 'common']);
  const { isOnline } = useSyncStatus();
  const isMobile = useMediaQuery('(max-width: 600px)');

  // Determine button text based on context
  const getSaveButtonText = () => {
    if (saveButtonText) return saveButtonText;

    if (isCreate) {
      return t('create');
    }
    return isOnline ? t('save') : t('saveOffline');
  };

  return (
    <Box component="form" onSubmit={onSubmit} noValidate>
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 4,
          position: 'relative'
        }}
      >
        {/* Form header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" component="h2">
            {title}
          </Typography>

          {!isOnline && (
            <Alert
              severity="warning"
              icon={<CloudOffIcon />}
              sx={{ mt: 2 }}
            >
              <AlertTitle>{t('offline.title')}</AlertTitle>
              {t('offline.formSaveMessage')}
            </Alert>
          )}

          {error && (
            <Alert
              severity="error"
              sx={{ mt: 2 }}
            >
              <AlertTitle>{t('common.error')}</AlertTitle>
              {error}
            </Alert>
          )}
        </Box>

        {/* Form sections */}
        <Box sx={{ mb: 4 }}>
          {sections.map((section, index) => (
            <Box key={`section-${index}`} sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                component="h3"
                sx={{ mb: 1 }}
              >
                {section.title}
              </Typography>

              {section.description && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {section.description}
                </Typography>
              )}

              <Box sx={{ mb: 2 }}>
                {section.component}
              </Box>

              {index < sections.length - 1 && (
                <Divider sx={{ my: 3 }} />
              )}
            </Box>
          ))}
        </Box>

        {/* Form actions */}
        <Grid container spacing={2} justifyContent="flex-end" direction={isMobile ? 'column-reverse' : 'row'}>
          {onCancel && !readOnly && (
            <Grid columns={12}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={onCancel}
                disabled={isSubmitting}
                fullWidth={isMobile}
              >
                {t('common.cancel')}
              </Button>
            </Grid>
          )}

          {additionalButtons && (
            <Grid columns={12}>{additionalButtons}</Grid>
          )}

          {!readOnly && (
            <Grid columns={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
                disabled={isSubmitting || !isValid || (!isDirty && !isCreate)}
                fullWidth={isMobile}
              >
                {getSaveButtonText()}
              </Button>
            </Grid>
          )}
        </Grid>

        {/* FHIR resource metadata */}
        {resource && !isCreate && (
          <Box
            sx={{
              mt: 4,
              pt: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              typography: 'caption',
              color: 'text.secondary'
            }}
          >
            <Grid container spacing={2}>
              <Grid columns={12} columnSpacing={4}>
                <Typography variant="caption" component="div">
                  {t('common.resourceType')}: {resource.resourceType}
                </Typography>
              </Grid>
              <Grid columns={12} columnSpacing={4}>
                <Typography variant="caption" component="div">
                  {t('common.id')}: {resource.id}
                </Typography>
              </Grid>
              <Grid columns={12} columnSpacing={4}>
                <Typography variant="caption" component="div">
                  {t('common.lastUpdated')}: {resource.meta?.lastUpdated ?
                    new Date(resource.meta.lastUpdated).toLocaleString() :
                    t('notAvailable', { ns: 'common' })}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default FHIRForm;
