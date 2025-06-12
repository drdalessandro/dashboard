"use client"

// src/features/practitioners/components/details/PractitionerHeader.tsx
import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Skeleton,
  Chip,
  Divider,
  Stack,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  Edit as EditIcon,
  School as QualificationIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Practitioner } from '@medplum/fhirtypes';

interface PractitionerHeaderProps {
  practitioner: Practitioner;
  onEdit?: () => void;
}

export const PractitionerHeader: React.FC<PractitionerHeaderProps> = React.memo(({ practitioner, onEdit }) => {

  const { t } = useTranslation(['practitioner', 'common']);
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Memoize the value to prevent unnecessary re-renders
  const isMobileValue = React.useMemo(() => isMobile, [isMobile]);

  // Handle edit button click with useCallback to avoid recreating this function
  const handleEditClick = React.useCallback(() => {
    if (onEdit) {
      onEdit();
    } else if (practitioner.id) {
      router.push(`/practitioners/edit/${practitioner.id}`);
    }
  }, [onEdit, practitioner.id, router]);

  // Extract practitioner info with useMemo to prevent recalculation
  const practitionerInfo = React.useMemo(() => ({
    id: practitioner.id || 'Unknown Practitioner',
    name: practitioner._computed?.formattedName || 'Unknown Practitioner',
    contactDetails: practitioner.telecom || [],
    address: practitioner.address || [],
    gender: practitioner.gender || 'unknown',
    qualification: practitioner.qualification?.[0]?.code?.text || 'Not specified'
  }), [practitioner]);

  return (
    <Box>
      <Grid container spacing={2} alignItems="center">
        {/* Avatar */}
        <Grid columns={{ xs: 12, sm: 2 }} display="flex" justifyContent="center">
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: 'primary.main'
            }}
          >
            {practitionerInfo.name ? practitionerInfo.name.charAt(0).toUpperCase() : '?'}
          </Avatar>
        </Grid>

        {/* Practitioner info */}
        <Grid columns={{ xs: 12, sm: 10 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="h5" component="h1">
              {practitionerInfo.name}
            </Typography>

            {/* Sync status indicator */}
            {/* {syncStatus === SyncStatus.OFFLINE && (
              <Chip
                size="small"
                label={t('common.syncStatus.offline')}
                color="warning"
                sx={{ ml: 2 }}
              />
            )} */}
          </Box>

          <Stack direction="row" spacing={2}>
            <Typography variant="body1" color="text.secondary">
              {t(`gender.${practitionerInfo.gender}`, { ns: 'practitioner' })}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <QualificationIcon fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="body1" color="text.secondary">
                {practitionerInfo.qualification}
              </Typography>
            </Box>
          </Stack>
        </Grid>

        {/* Actions */}
        <Grid columns={{ xs: 12, sm: 2 }}>
          <Tooltip title={t('actions.edit', { ns: 'common' })}>
            <IconButton
              color="primary"
              size="large"
              onClick={handleEditClick}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Contact details */}
      <Stack direction="row" spacing={3}>
        {practitionerInfo.contactDetails.map((contact, index) => {
          const isPhone = contact.system === 'phone';
          const isEmail = contact.system === 'email';

          return (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
              {isPhone && <PhoneIcon fontSize="small" sx={{ mr: 1 }} />}
              {isEmail && <EmailIcon fontSize="small" sx={{ mr: 1 }} />}
              <Typography>
                {contact.value}
              </Typography>
            </Box>
          );
        })}

        {practitionerInfo.contactDetails.length === 0 && (
          <Typography color="text.secondary">
            {t('noContactInfo', { ns: 'practitioner' })}
          </Typography>
        )}
      </Stack>

      {/* address details */}
      <Stack direction="row" spacing={3}>
        {practitionerInfo.address.map((addr, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              {addr.text}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
});