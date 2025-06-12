/**
 * PatientCard
 * A reusable card component for displaying patient information
 * Designed specifically for healthcare contexts in Mali and Sub-Saharan Africa
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
  Avatar,
  Divider,
  Badge
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  CloudOff as CloudOffIcon,
  CloudDone as CloudDoneIcon,
  CloudSync as CloudSyncIcon,
  Female as FemaleIcon,
  Male as MaleIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { Patient } from '@medplum/fhirtypes';
import { SyncStatus } from '../../data/models/base';
import { useTranslation } from 'react-i18next';
import { formatPatientName, formatContactPoint, formatAddress } from '../../utils/fhir/formatters';

interface PatientCardProps {
  /**
   * The patient to display
   */
  patient: Patient;

  /**
   * Current sync status of the patient data
   */
  syncStatus?: SyncStatus;

  /**
   * Handler for viewing the patient details
   */
  onView?: (patient: Patient) => void;

  /**
   * Handler for editing the patient
   */
  onEdit?: (patient: Patient) => void;

  /**
   * Handler for deleting the patient
   */
  onDelete?: (patient: Patient) => void;

  /**
   * Whether the card is in compact mode
   */
  compact?: boolean;

  /**
   * Whether the patient is offline-only
   */
  isOfflineOnly?: boolean;
}

/**
 * A card component for displaying patient information
 * Optimized for use in low-connectivity healthcare environments
 */
export const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  syncStatus = SyncStatus.SYNCED,
  onView,
  onEdit,
  onDelete,
  compact = false,
  isOfflineOnly = false
}) => {
  const { t } = useTranslation(['common', 'patient']);

  // Extract primary phone number
  const primaryPhone = patient.telecom?.find(t => t.system === 'phone' && t.use === 'mobile');

  // Extract primary address
  const primaryAddress = patient.address?.[0];

  // Calculate age
  const getAge = (): string => {
    if (!patient.birthDate) return t('messages.unknownAge', { ns: 'patient' });

    const birthDate = new Date(patient.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age.toString();
  };

  // Get gender icon
  const getGenderIcon = () => {
    switch (patient.gender) {
      case 'male':
        return <MaleIcon sx={{ color: 'info.main' }} />;
      case 'female':
        return <FemaleIcon sx={{ color: 'secondary.main' }} />;
      default:
        return <PersonIcon />;
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

  // Get patient initials for avatar
  const getInitials = (): string => {
    if (!patient.name || patient.name.length === 0) return '?';

    const name = patient.name[0];
    let initials = '';

    if (name.given && name.given.length > 0) {
      initials += name.given[0].charAt(0);
    }

    if (name.family) {
      initials += name.family.charAt(0);
    }

    return initials.toUpperCase();
  };

  // Render card content based on mode
  const renderContent = () => {
    if (compact) {
      return (
        <CardContent sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <Tooltip title={t(`gender.${patient.gender || 'unknown'}`)}>
                  {getGenderIcon()}
                </Tooltip>
              }
            >
              <Avatar sx={{ bgcolor: 'primary.main', mr: 1 }}>
                {getInitials()}
              </Avatar>
            </Badge>
            <Box sx={{ ml: 1 }}>
              <Typography variant="h6" component="div" noWrap>
                {formatPatientName(patient)}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {t('patient.age')}: {getAge()}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      );
    }

    return (
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <Tooltip title={t(`gender.${patient.gender || 'unknown'}`)}>
                {getGenderIcon()}
              </Tooltip>
            }
          >
            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
              {getInitials()}
            </Avatar>
          </Badge>

          <Box sx={{ ml: 2 }}>
            <Typography variant="h5" component="div">
              {formatPatientName(patient)}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
              <Chip
                size="small"
                label={t(`gender.${patient.gender || 'unknown'}`, { ns: 'common' })}
                sx={{ mr: 1 }}
              />
              <Chip
                size="small"
                label={`${getAge()} ${t('labels.personalInfo.age', { ns: 'patient' })}`}
              />
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        <Grid container spacing={2}>
          <Grid columns={{ xs: 12, sm: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              {t('labels.contactInfo.title', { ns: 'patient' })}
            </Typography>

            {primaryPhone ? (
              <Typography variant="body2">
                {formatContactPoint(primaryPhone)}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.disabled">
                {t('labels.contactInfo.noPhone', { ns: 'patient' })}
              </Typography>
            )}
          </Grid>

          <Grid columns={{ xs: 12, sm: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              {t('labels.address.title', { ns: 'patient' })}
            </Typography>

            {primaryAddress ? (
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                {formatAddress(primaryAddress, { singleLine: true })}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.disabled">
                {t('labels.address.noAddress', { ns: 'patient' })}
              </Typography>
            )}
          </Grid>

          {patient.identifier && patient.identifier.length > 0 && (
            <Grid columns={12}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('labels.identifiers', { ns: 'patient' })}
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                {patient.identifier.map((id, index) => (
                  <Chip
                    key={`id-${index}`}
                    size="small"
                    label={`${id.system ? `${id.system}: ` : ''}${id.value}`}
                  />
                ))}
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
    );
  };

  return (
    <Card
      elevation={2}
      sx={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Sync status indicator */}
      <Tooltip
        title={isOfflineOnly
          ? t('sync.offlineOnly', { ns: 'common' })
          : t(`sync.status.${syncStatus}`, { ns: 'common' })}
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

      {renderContent()}

      <Box sx={{ flexGrow: 1 }} />

      <CardActions sx={{ justifyContent: 'flex-end', p: 1 }}>
        {onView && (
          <Tooltip title={t('actions.view', { ns: 'common' })}>
            <IconButton
              size="small"
              onClick={() => onView(patient)}
              aria-label={t('actions.view', { ns: 'common' })}
            >
              <ViewIcon />
            </IconButton>
          </Tooltip>
        )}

        {onEdit && (
          <Tooltip title={t('actions.edit', { ns: 'common' })}>
            <IconButton
              size="small"
              onClick={() => onEdit(patient)}
              aria-label={t('actions.edit', { ns: 'common' })}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
        )}

        {onDelete && (
          <Tooltip title={t('actions.delete', { ns: 'common' })}>
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(patient)}
              aria-label={t('actions.delete', { ns: 'common' })}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );
};

export default PatientCard;
