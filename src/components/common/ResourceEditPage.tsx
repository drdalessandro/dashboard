/**
 * ResourceEditPage.tsx
 * 
 * A generic component for editing FHIR resources with common functionality:
 * - Loading states
 * - Error handling
 * - Form submission
 * - Navigation
 */
import React, { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import { isServerConnected } from '../../lib/medplum/client';
import { createLogger } from '../../utils/logger';
import { Resource } from '@medplum/fhirtypes';

// Define props for the resource edit page
export interface ResourceEditPageProps<
  TResource extends Resource = Resource,
  TFormValues = any
> {
  // Resource info
  resourceType: string;
  resourceId?: string;
  resourceDisplayName: string;

  // Data fetching and submission
  fetchResource: (id: string) => Promise<TResource>;
  saveResource: (values: TFormValues) => Promise<TResource>;
  mapResourceToForm: (resource: TResource) => TFormValues;
  defaultFormValues: TFormValues;

  // Form component
  renderForm: (props: ResourceFormRenderProps<TFormValues>) => React.ReactNode;

  // Navigation
  listPageUrl: string;
  detailPageUrl: (id: string) => string;

  // Optional
  steps?: string[];
  validateForm?: (values: TFormValues) => boolean;
}

// Props passed to the form renderer
export interface ResourceFormRenderProps<TFormValues> {
  formValues: TFormValues;
  setFormValues: React.Dispatch<React.SetStateAction<TFormValues>>;
  handleSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  errors: Record<string, string>;
  resetForm: () => void;
  handleCancel: () => void;
  isOfflineMode: boolean;
}

export function ResourceEditPage<
  TResource extends Resource,
  TFormValues
>({
  resourceType,
  resourceId,
  resourceDisplayName,
  fetchResource,
  saveResource,
  mapResourceToForm,
  defaultFormValues,
  renderForm,
  listPageUrl,
  detailPageUrl,
  steps,
  validateForm
}: ResourceEditPageProps<TResource, TFormValues>) {
  const { t } = useTranslation(['practitioner', 'common']);
  const router = useRouter();
  const logger = createLogger(`${resourceType}EditPage`);

  // State management
  const [formValues, setFormValues] = useState<TFormValues>(defaultFormValues);
  const [isLoading, setIsLoading] = useState<boolean>(!!resourceId);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(!isServerConnected());

  // Keep track of if we've already fetched this resource
  const fetchedResourceId = React.useRef<string | undefined>(undefined);

  // Fetch resource data
  useEffect(() => {
    // Skip the fetch if we don't have a resourceId or if we've already fetched this resource
    if (!resourceId || fetchedResourceId.current === resourceId) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setFetchError(undefined);

        const resource = await fetchResource(resourceId);
        fetchedResourceId.current = resourceId;

        // Transform the resource to form values once
        const formValues = mapResourceToForm(resource);

        // Use functional update to prevent unnecessary renders
        setFormValues(formValues);
        setIsLoading(false);
      } catch (error) {
        logger.error(t('errors.loadFailed', {
          resource: resourceDisplayName.toLowerCase()
        }), {
          error: error instanceof Error ? error.message : 'Unknown error',
          resourceId,
        });

        setFetchError(error instanceof Error
          ? error.message
          : t('errors.loadFailed', {
            resource: resourceDisplayName.toLowerCase()
          })
        );
        setIsLoading(false);
      }
    };

    fetchData();
  }, [resourceId, fetchResource, mapResourceToForm, resourceType, resourceDisplayName, t, logger]);

  // Monitor connectivity status
  useEffect(() => {
    const checkConnectivity = () => {
      const connected = isServerConnected();
      setIsOfflineMode(prev => {
        // Only update if there's been a change to avoid unnecessary rerenders
        if (prev === !connected) return prev;
        return !connected;
      });
    };

    // Initial check
    checkConnectivity();

    // Set up interval to check periodically
    const intervalId = setInterval(checkConnectivity, 30000);

    return () => clearInterval(intervalId);
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      // Optional form validation
      if (validateForm) {
        const isValid = validateForm(formValues);
        if (!isValid) {
          setIsSubmitting(false);
          return;
        }
      }

      const savedResource = await saveResource(formValues);
      logger.info(t('success.save', {
        resource: resourceDisplayName.toLowerCase()
      }), {
        resourceId: savedResource.id
      });

      // Navigate to the detail page with refresh parameter to trigger data reload
      const detailUrl = detailPageUrl(savedResource.id!);
      const urlWithRefresh = `${detailUrl}?refresh=true&timestamp=${Date.now()}`;
      router.push(urlWithRefresh);
    } catch (error) {
      logger.error(t('errors.saveFailed', {
        resource: resourceDisplayName.toLowerCase()
      }), {
        error: error instanceof Error ? error.message : 'Unknown error',
        formData: JSON.stringify(formValues)
      });

      setFetchError(error instanceof Error
        ? error.message
        : t('errors.saveFailed', {
          resource: resourceDisplayName.toLowerCase()
        })
      );
      setIsSubmitting(false);
    }
  };

  // Handle form reset
  const resetForm = () => {
    if (window.confirm(t('confirmReset', {
      defaultValue: 'Are you sure you want to reset the form? All unsaved changes will be lost.'
    }))) {
      if (resourceId) {
        // If editing existing resource, refetch it
        setIsLoading(true);
        fetchResource(resourceId)
          .then(resource => {
            setFormValues(mapResourceToForm(resource));
            setIsLoading(false);
          })
          .catch(error => {
            logger.error(t('errors.loadFailed', { ns: 'common' }), {
              resource: resourceDisplayName.toLowerCase()
            }, {
              error: error instanceof Error ? error.message : 'Unknown error',
              resourceId
            });
            setIsLoading(false);
          });
      } else {
        // If creating new resource, reset to defaults
        setFormValues(defaultFormValues);
      }

      // Clear any errors
      setErrors({});
      setFetchError(undefined);
    }
  };

  // Handle cancellation
  const handleCancel = () => {
    if (resourceId) {
      router.push(detailPageUrl(resourceId));
    } else {
      router.push(listPageUrl);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (fetchError) {
    return (
      <Box sx={{ maxWidth: '1200px', mx: 'auto', p: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{fetchError}</Alert>
        <Button
          variant="outlined"
          onClick={() => {
            if (resourceId) {
              router.push(detailPageUrl(resourceId));
            } else {
              router.push(listPageUrl);
            }
          }}
          startIcon={<ArrowBackIcon />}
        >
          {t('backToDetail', { ns: 'common' })}
        </Button>
      </Box>
    );
  }

  // Render the edit page
  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', p: 2 }}>
      {/* Offline notice */}
      {isOfflineMode && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WifiOffIcon sx={{ mr: 1 }} />
            {t('offlineMode', {
              ns: 'common',
              defaultValue: t('common.offlineMode', { ns: 'common' })
            })}
          </Box>
        </Alert>
      )}

      {/* Steps if provided */}
      {steps && steps.length > 0 && (
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={index} completed={index < activeStep}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      )}

      {/* <Typography variant="h5" component="h1" sx={{ mb: 3 }}>
        {resourceId
          ? t('edit', { ns: 'common', resource: resourceDisplayName })
          : t('create', { ns: 'common', resource: resourceDisplayName })
        }
      </Typography> */}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {renderForm({
          formValues,
          setFormValues,
          handleSubmit,
          isSubmitting,
          errors,
          resetForm,
          handleCancel,
          isOfflineMode
        })}

        {/* Action Buttons */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 2,
          position: 'sticky',
          bottom: 0,
          backgroundColor: 'background.paper',
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          zIndex: 1000,
          mt: 3
        }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={resetForm}
            disabled={isSubmitting}
          >
            {t('reset', { ns: 'common' })}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {t('cancel', { ns: 'common' })}
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {t('save', { ns: 'common' })}
          </Button>
        </Box>
      </form>
    </Box>
  );
}
