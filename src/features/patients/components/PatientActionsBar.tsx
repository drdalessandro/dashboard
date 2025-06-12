"use client";

import React from 'react';
import { Box, Button } from '@mui/material';
import { Add as AddIcon, Sync as SyncIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface PatientActionsBarProps {
  onCreatePatient: () => void;
  onSyncData?: () => void;
  isOffline?: boolean;
}

const PatientActionsBar: React.FC<PatientActionsBarProps> = ({
  onCreatePatient,
  onSyncData,
  isOffline = false
}) => {
  const { t } = useTranslation('patient');

  return (
    <Box sx={{
      display: 'flex',
      flexShrink: 0,
      alignSelf: 'center',
    }}>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onCreatePatient}
        sx={{ borderRadius: 2, whiteSpace: 'nowrap' }}
      >
        {t('patient.actions.create')}
      </Button>

      {isOffline && onSyncData && (
        <Button
          variant="outlined"
          startIcon={<SyncIcon />}
          onClick={onSyncData}
          disabled={!isOffline}
          sx={{ borderRadius: 2, ml: 1 }}
        >
          {t('common.sync')}
        </Button>
      )}
    </Box>
  );
};

export default PatientActionsBar;