/**
 * MedicationCard
 * A reusable card component for displaying medication information
 * Optimized for healthcare contexts in Mali and Sub-Saharan Africa
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  Stack,
  Badge
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  CloudOff as CloudOffIcon,
  CloudDone as CloudDoneIcon,
  CloudSync as CloudSyncIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  LocalPharmacy as PharmacyIcon
} from '@mui/icons-material';
import { Medication, MedicationRequest } from '@medplum/fhirtypes';
import { SyncStatus } from '../../data/models/base';
import { useSyncStatus } from '../../hooks/common/useSyncStatus';
import { useTranslation } from '../../hooks/common/useTranslation';
import { formatDate } from '../../utils/fhir/formatters';
import { Grid } from '@mui/material';

interface MedicationCardProps {
  /**
   * MedicationRequest resource
   */
  medicationRequest: MedicationRequest;

  /**
   * Optional medication resource (if loaded)
   */
  medication?: Medication;

  /**
   * Current sync status
   */
  syncStatus?: SyncStatus;

  /**
   * Whether the card is in compact mode
   */
  compact?: boolean;

  /**
   * Whether the medication is offline-only
   */
  isOfflineOnly?: boolean;

  /**
   * Handler for viewing the medication details
   */
  onView?: (medicationRequest: MedicationRequest) => void;

  /**
   * Handler for editing the medication
   */
  onEdit?: (medicationRequest: MedicationRequest) => void;

  /**
   * Handler for deleting the medication
   */
  onDelete?: (medicationRequest: MedicationRequest) => void;

  /**
   * Custom click handler
   */
  onClick?: (medicationRequest: MedicationRequest) => void;
}

/**
 * A medication card component that displays medication information
 * Optimized for use in low-connectivity healthcare environments
 */
export const MedicationCard: React.FC<MedicationCardProps> = ({
  medicationRequest,
  medication,
  syncStatus = SyncStatus.SYNCED,
  compact = false,
  isOfflineOnly = false,
  onView,
  onEdit,
  onDelete,
  onClick
}) => {
  const { t } = useTranslation();
  const { isOnline } = useSyncStatus();

  // Get medication name from reference or display
  const getMedicationName = (): string => {
    // If we have the medication resource
    if (medication) {
      return medication.code?.coding?.[0]?.display ||
        medication.code?.text ||
        t('medication.unknown');
    }

    // Get from medicationRequest
    if (medicationRequest.medicationCodeableConcept) {
      return medicationRequest.medicationCodeableConcept.coding?.[0]?.display ||
        medicationRequest.medicationCodeableConcept.text ||
        t('medication.unknown');
    }

    // Get ID from reference as fallback
    if (medicationRequest.medicationReference?.reference) {
      const parts = medicationRequest.medicationReference.reference.split('/');
      return parts[parts.length - 1] || t('medication.unknown');
    }

    return t('medication.unknown');
  };

  // Get status color
  const getStatusColor = () => {
    switch (medicationRequest.status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'info';
      case 'stopped':
      case 'cancelled':
      case 'entered-in-error':
        return 'error';
      case 'draft':
      case 'on-hold':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Get status icon
  const getStatusIcon = () => {
    switch (medicationRequest.status) {
      case 'active':
        return <CheckCircleIcon fontSize="small" />;
      case 'completed':
        return <CheckCircleIcon fontSize="small" />;
      case 'draft':
      case 'on-hold':
        return <AccessTimeIcon fontSize="small" />;
      case 'stopped':
      case 'cancelled':
      case 'entered-in-error':
        return <WarningIcon fontSize="small" />;
      default:
        return <PharmacyIcon fontSize="small" />;
    }
  };

  // Get sync status icon
  const getSyncStatusIcon = () => {
    if (isOfflineOnly) {
      return <CloudOffIcon color="error" />;
    }

    switch (syncStatus) {
      case SyncStatus.SYNCED:
        return <CloudDoneIcon color="success" />;
      case SyncStatus.PENDING:
      case SyncStatus.SYNCING:
        return <CloudSyncIcon color="warning" />;
      case SyncStatus.OFFLINE:
      case SyncStatus.ERROR:
        return <CloudOffIcon color="error" />;
      default:
        return <CloudSyncIcon />;
    }
  };

  // Format dosage information
  const formatDosage = (): string => {
    if (!medicationRequest.dosageInstruction || medicationRequest.dosageInstruction.length === 0) {
      return t('medication.noDosage');
    }

    const dosage = medicationRequest.dosageInstruction[0];

    // If we have complete text, use it
    if (dosage.text) {
      return dosage.text;
    }

    // Otherwise build from components
    const doseText = dosage.doseAndRate?.[0]?.doseQuantity
      ? `${dosage.doseAndRate[0].doseQuantity.value} ${dosage.doseAndRate[0].doseQuantity.unit || ''}`
      : '';

    const frequencyText = dosage.timing?.code?.text ||
      dosage.timing?.code?.coding?.[0]?.display || '';

    const routeText = dosage.route?.coding?.[0]?.display ||
      dosage.route?.text || '';

    return [doseText, frequencyText, routeText].filter(Boolean).join(' - ');
  };

  // Get prescription date
  const getPrescriptionDate = (): string => {
    if (medicationRequest.authoredOn) {
      return formatDate(medicationRequest.authoredOn, { includeTime: false });
    }
    return t('notAvailable', { ns: 'common' });
  };

  // Handle card click
  const handleCardClick = () => {
    if (onClick) {
      onClick(medicationRequest);
    }
  };

  // Render compact content
  const renderCompactContent = () => (
    <CardContent
      sx={{
        p: 2,
        pb: '12px !important',
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={handleCardClick}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6" component="div" noWrap>
          {getMedicationName()}
        </Typography>

        <Chip
          size="small"
          color={getStatusColor() as any}
          label={t(`medication.status.${medicationRequest.status}`) || medicationRequest.status}
          icon={getStatusIcon()}
        />
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {formatDosage()}
      </Typography>

      <Typography variant="caption" color="text.secondary">
        {t('medication.prescribedOn')}: {getPrescriptionDate()}
      </Typography>
    </CardContent>
  );

  // Render full content
  const renderFullContent = () => (
    <CardContent
      sx={{
        p: 2,
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={handleCardClick}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" component="div">
          {getMedicationName()}
        </Typography>

        <Chip
          color={getStatusColor() as any}
          label={t(`medication.status.${medicationRequest.status}`) || medicationRequest.status}
          icon={getStatusIcon()}
        />
      </Box>

      <Divider sx={{ my: 1.5 }} />

      <Grid container spacing={2} sx={{ mb: 1 }}>
        <Grid columns={12}>
          <Typography variant="subtitle2" color="text.secondary">
            {t('medication.dosage')}
          </Typography>
          <Typography variant="body2">
            {formatDosage()}
          </Typography>
        </Grid>

        <Grid columns={{ xs: 12, sm: 6 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {t('medication.prescribedOn')}
          </Typography>
          <Typography variant="body2">
            {getPrescriptionDate()}
          </Typography>
        </Grid>

        <Grid columns={{ xs: 12, sm: 6 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {t('medication.prescribedBy')}
          </Typography>
          <Typography variant="body2">
            {medicationRequest.requester?.display ||
              (medicationRequest.requester?.reference &&
                medicationRequest.requester.reference.split('/')[1]) ||
              t('common.unknown')}
          </Typography>
        </Grid>
      </Grid>

      {medicationRequest.note && medicationRequest.note.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {t('medication.notes')}
          </Typography>

          <Stack spacing={1}>
            {medicationRequest.note.map((note, index) => (
              <Box key={index} sx={{ bgcolor: 'background.subtle', p: 1, borderRadius: 1 }}>
                <Typography variant="body2">
                  {note.text}
                </Typography>
                {note.time && (
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(note.time, { includeTime: true })}
                  </Typography>
                )}
              </Box>
            ))}
          </Stack>
        </Box>
      )}
    </CardContent>
  );

  return (
    <Card
      elevation={2}
      sx={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s',
        '&:hover': onClick ? {
          boxShadow: 6,
          transform: 'translateY(-2px)'
        } : {}
      }}
    >
      {/* Sync status indicator */}
      <Tooltip
        title={isOfflineOnly
          ? t('sync.offlineOnly')
          : t(`sync.status.${syncStatus}`)}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1
          }}
        >
          {getSyncStatusIcon()}
        </Box>
      </Tooltip>

      {/* Render appropriate content based on mode */}
      {compact ? renderCompactContent() : renderFullContent()}

      <Box sx={{ flexGrow: 1 }} />

      {/* Card actions */}
      {(onView || onEdit || onDelete) && (
        <CardActions sx={{ justifyContent: 'flex-end', p: 1 }}>
          {onView && (
            <Tooltip title={t('actions.view')}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(medicationRequest);
                }}
                aria-label={t('actions.view')}
              >
                <ViewIcon />
              </IconButton>
            </Tooltip>
          )}

          {onEdit && (
            <Tooltip title={t('actions.edit')}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(medicationRequest);
                }}
                aria-label={t('actions.edit')}
                disabled={!isOnline && !isOfflineOnly}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}

          {onDelete && (
            <Tooltip title={t('actions.delete')}>
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(medicationRequest);
                }}
                aria-label={t('actions.delete')}
                disabled={!isOnline && !isOfflineOnly}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </CardActions>
      )}
    </Card>
  );
};

export default MedicationCard;
