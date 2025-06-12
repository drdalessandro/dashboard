/**
 * @file PatientEditModal.tsx - Modal wrapper for patient editing
 * @description Modal component that uses ResourceEditPage logic for consistency
 */
import React, { useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close as CloseIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Patient } from '@medplum/fhirtypes';

import { ResourceEditPage } from '../../../components/common/ResourceEditPage';
import { useResource } from '../../../hooks/useResource';
import PatientForm from './PatientForm';
import { patientAdapter, PatientFormValues } from '@/adapters/PatientAdapter';
import { alpha } from '@mui/material/styles';

interface PatientEditModalProps {
  open: boolean;
  onClose: () => void;
  patient: Patient;
  onSave?: (patient: Patient) => void;
}

const PatientEditModal: React.FC<PatientEditModalProps> = ({
  open,
  onClose,
  patient,
  onSave
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useTranslation(['patient', 'common']);
  const router = useRouter();

  // Use the resource hook for Patient resources (same as PatientEditPage)
  const { fetchResource, updateResource } = useResource({
    resourceType: 'Patient'
  });

  // Memoize handlers to avoid recreating them on every render (same as PatientEditPage)
  const handleFetchPatient = React.useCallback(async (id: string): Promise<Patient> => {
    return await fetchResource<Patient>(id);
  }, [fetchResource]);

  // Handler for saving a patient resource - let ResourceEditPage handle navigation
  const handleSavePatient = React.useCallback(async (formValues: PatientFormValues): Promise<Patient> => {
    const patientResource = patientAdapter.toResource(formValues, patient.id);
    const savedPatient = await updateResource<Patient>(patientResource);

    // Call onSave callback if provided
    if (onSave) {
      onSave(savedPatient);
    }

    // Close modal - ResourceEditPage will handle navigation with refresh parameters
    onClose();

    return savedPatient;
  }, [updateResource, patient.id, onSave, onClose]);

  // Handle modal close and navigate back to patient details page
  const handleClose = useCallback(() => {
    // Close modal first
    onClose();

    // Navigate back to patient details page
    const detailUrl = `/patients/show/${patient.id}`;
    router.push(detailUrl);
  }, [onClose, router, patient.id]);

  // Custom render function that handles cancel and reset button logic
  const renderPatientForm = React.useCallback((props: any) => {
    const customProps = {
      ...props,
      handleCancel: handleClose, // Override cancel to close modal
    };

    // Create a wrapper with modal-specific styling
    return (
      <Box sx={{
        // Override PatientForm styles for modal
        '& > .MuiBox-root': {
          backgroundColor: 'transparent !important',
          minHeight: 'auto !important',
          py: '0 !important',
          '& > .MuiBox-root': {
            maxWidth: 'none !important',
            margin: '0 !important',
            px: '2 !important',
          }
        }
      }}>
        <PatientForm {...customProps} />
      </Box>
    );
  }, [handleClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xl"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          maxHeight: '95vh',
          height: isMobile ? '100vh' : '90vh',
          width: isMobile ? '100vw' : '95vw',
          margin: 'auto'
        }
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)'
          }
        }
      }}
    >
      {/* Modal Header */}
      <DialogTitle sx={{ px: 2, py: 1.5, pb: 1 }}>
        {/* Page Header */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h5"
              component="h2"
              sx={{
                color: '#1e293b',
                fontWeight: 600,
                fontSize: '1.5rem',
                lineHeight: 1.2,
                mb: 0.5
              }}
            >
              Edit Patient Details - {patient.name?.[0]?.given?.[0]} {patient.name?.[0]?.family}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#64748b',
                fontSize: '0.875rem',
                lineHeight: 1.4
              }}
            >
              Update patient information in the system.
            </Typography>
          </Box>
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              color: theme.palette.grey[500],
              '&:hover': {
                backgroundColor: alpha(theme.palette.grey[500], 0.1)
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Modal Content - Use ResourceEditPage for consistency */}
      <DialogContent
        dividers
        sx={{
          p: 0,
          overflow: 'auto',
          height: 'calc(90vh - 140px)', // Subtract header and footer height
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#c1c1c1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#a1a1a1',
          },
          // Override ResourceEditPage styles for modal
          '& > .MuiBox-root': {
            maxWidth: 'none !important',
            padding: '0 !important',
            margin: '0 !important',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          },
          // Target the action buttons container and hide the reset button for edit mode
          '& form': {
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            '& > div:first-of-type': {
              flex: 1,
              overflow: 'auto',
              padding: '1rem',
            },
            '& > div:last-child': {
              flexShrink: 0,
              borderTop: '1px solid #e2e8f0',
              backgroundColor: 'white',
              padding: '16px',
              '& button:first-of-type': {
                display: patient.id ? 'none' : 'inline-flex', // Hide reset button only in edit mode
              },
            },
          },
        }}>
          <ResourceEditPage<Patient, PatientFormValues>
            resourceType="Patient"
            resourceId={patient.id}
            resourceDisplayName={t('labels.personalInfo.title', { ns: 'patient' })}
            fetchResource={handleFetchPatient}
            saveResource={handleSavePatient}
            mapResourceToForm={React.useCallback((resource) => patientAdapter.toFormValues(resource), [])}
            defaultFormValues={patientAdapter.toFormValues(patient)}
            renderForm={renderPatientForm}
            listPageUrl="/patients"
            detailPageUrl={(id) => `/patients/show/${id}`}
            validateForm={(values) => patientAdapter.validateFormValues(values)}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default PatientEditModal;