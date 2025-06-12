"use client";

import React from 'react';
import { Box, Button, Tooltip, IconButton } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  Add as AddIcon,
  Sync as SyncIcon,
  CloudOff as CloudOffIcon
} from '@mui/icons-material';

interface PractitionerActionsBarProps {
  onCreatePractitioner: () => void;
  isOffline?: boolean;
  onSyncData?: () => void;
}

const PractitionerActionsBar: React.FC<PractitionerActionsBarProps> = ({
  onCreatePractitioner,
  isOffline = false,
  onSyncData
}) => {
  const { t } = useTranslation(['practitioner', 'common']);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {/* Offline indicator */}
      {isOffline && (
        <Tooltip title={t('status.offline', { ns: 'common' })}>
          <CloudOffIcon color="warning" />
        </Tooltip>
      )}

      {/* Sync button */}
      {onSyncData && (
        <Tooltip title={t('actions.sync', { ns: 'common' })}>
          <IconButton onClick={onSyncData} color="primary" disabled={isOffline}>
            <SyncIcon />
          </IconButton>
        </Tooltip>
      )}

      {/* Create practitioner button */}
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onCreatePractitioner}
        color="primary"
        sx={{ borderRadius: 2 }}
      >
        {t('add', { ns: 'common' })}
      </Button>
    </Box>
  );
};

export default PractitionerActionsBar;
