/**
 * @file PractitionerEditModal.tsx - Modal wrapper for practitioner editing
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
import { Practitioner } from '@medplum/fhirtypes';

import { ResourceEditPage } from '../../../components/common/ResourceEditPage';
import { useResource } from '../../../hooks/useResource';
import PractitionerForm from './PractitionerForm';
import { practitionerAdapter, PractitionerFormValues } from '@/adapters/PractitionerAdapter';
import { alpha } from '@mui/material/styles';

interface PractitionerEditModalProps {
  open: boolean;
  onClose: () => void;
  practitioner: Practitioner;
  onSave?: (practitioner: Practitioner) => void;
}

const PractitionerEditModal: React.FC<PractitionerEditModalProps> = ({
  open,
  onClose,
  practitioner,
  onSave
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useTranslation(['practitioner', 'common']);
  const router = useRouter();

  // Use the resource hook for Practitioner resources (same as PractitionerEditPage)
  const { fetchResource, updateResource } = useResource({
    resourceType: 'Practitioner'
  });

  // Memoize handlers to avoid recreating them on every render (same as PractitionerEditPage)
  const handleFetchPractitioner = React.useCallback(async (id: string): Promise<Practitioner> => {
    return await fetchResource<Practitioner>(id);
  }, [fetchResource]);

  // Handler for saving a practitioner resource - let ResourceEditPage handle navigation
  const handleSavePractitioner = React.useCallback(async (formValues: PractitionerFormValues): Promise<Practitioner> => {
    const practitionerResource = practitionerAdapter.toResource(formValues, practitioner.id);
    const savedPractitioner = await updateResource<Practitioner>(practitionerResource);

    // Call onSave callback if provided
    if (onSave) {
      onSave(savedPractitioner);
    }

    // Close modal first
    onClose();

    // Navigate back to practitioner details page with refresh
    const detailUrl = `/practitioners/show/${practitioner.id}?refresh=${Date.now()}`;
    router.push(detailUrl);

    return savedPractitioner;
  }, [updateResource, practitioner.id, onSave, onClose, router]);

  // Handle modal close and navigate back to practitioner details page
  const handleClose = useCallback(() => {
    // Close modal first
    onClose();

    // Navigate back to practitioner details page
    const detailUrl = `/practitioners/show/${practitioner.id}`;
    router.push(detailUrl);
  }, [onClose, router, practitioner.id]);

  // Custom render function that handles cancel and reset button logic
  const renderPractitionerForm = React.useCallback((props: any) => {
    const customProps = {
      ...props,
      handleCancel: handleClose, // Override cancel to close modal
    };

    // Create a wrapper with modal-specific styling
    return (
      <Box sx={{
        // Override PractitionerForm styles for modal
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
        <PractitionerForm {...customProps} />
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
              Edit Practitioner Details - {practitioner.name?.[0]?.given?.[0]} {practitioner.name?.[0]?.family}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#64748b',
                fontSize: '0.875rem',
                lineHeight: 1.4
              }}
            >
              Update practitioner information in the system.
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
          // Ensure action buttons are visible and style them properly
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
                display: practitioner.id ? 'none' : 'inline-flex', // Hide reset button only in edit mode
              },
            },
          },
        }}>
          <ResourceEditPage<Practitioner, PractitionerFormValues>
            resourceType="Practitioner"
            resourceId={practitioner.id}
            resourceDisplayName={t('details.personalInfo', { ns: 'practitioner' })}
            fetchResource={handleFetchPractitioner}
            saveResource={handleSavePractitioner}
            mapResourceToForm={React.useCallback((resource) => practitionerAdapter.toFormValues(resource), [])}
            defaultFormValues={practitionerAdapter.toFormValues(practitioner)}
            renderForm={renderPractitionerForm}
            listPageUrl="/practitioners"
            detailPageUrl={(id) => `/practitioners/show/${id}`}
            validateForm={(values) => practitionerAdapter.validateFormValues(values)}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default PractitionerEditModal;