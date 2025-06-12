/**
 * SyncStatusIndicator
 * Visual indicator showing the current synchronization status of offline data
 * Critical for healthcare providers to understand data freshness and reliability
 */

import React from 'react';
import { 
  Box, 
  Tooltip, 
  IconButton, 
  Typography, 
  CircularProgress 
} from '@mui/material';
import {
  CloudDone as CloudDoneIcon,
  CloudOff as CloudOffIcon,
  CloudSync as CloudSyncIcon,
  CloudQueue as CloudQueueIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useSyncStatus } from '../../hooks/common/useSyncStatus';
import { SyncStatus } from '../../data/models/base';
import { useTranslation } from '../../hooks/common/useTranslation';

interface SyncStatusIndicatorProps {
  showText?: boolean;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Component that displays the current synchronization status of the application
 * and provides a way to trigger manual synchronization
 */
export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  showText = true,
  onClick,
  size = 'medium'
}) => {
  const { t } = useTranslation();
  const { 
    syncStatus, 
    hasPendingChanges, 
    lastSyncTime, 
    isOnline, 
    syncAll 
  } = useSyncStatus();
  
  // Determine the icon and text based on sync status
  const getStatusInfo = () => {
    switch (syncStatus) {
      case SyncStatus.SYNCED:
        return {
          icon: <CloudDoneIcon color="success" />,
          text: t('sync.status.synced'),
          tooltip: t('sync.tooltip.synced', {
            time: lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : t('sync.never')
          })
        };
      case SyncStatus.PENDING:
        return {
          icon: <CloudQueueIcon color="warning" />,
          text: t('sync.status.pending'),
          tooltip: t('sync.tooltip.pending')
        };
      case SyncStatus.SYNCING:
        return {
          icon: <CircularProgress size={24} />,
          text: t('sync.status.syncing'),
          tooltip: t('sync.tooltip.syncing')
        };
      case SyncStatus.OFFLINE:
        return {
          icon: <CloudOffIcon color="error" />,
          text: t('sync.status.offline'),
          tooltip: t('sync.tooltip.offline')
        };
      case SyncStatus.ERROR:
        return {
          icon: <ErrorIcon color="error" />,
          text: t('sync.status.error'),
          tooltip: t('sync.tooltip.error')
        };
      default:
        return {
          icon: <CloudSyncIcon />,
          text: t('sync.status.unknown'),
          tooltip: t('sync.tooltip.unknown')
        };
    }
  };
  
  const { icon, text, tooltip } = getStatusInfo();
  
  // Handle the sync button click
  const handleSyncClick = () => {
    if (onClick) {
      onClick();
    } else if (isOnline && (hasPendingChanges || syncStatus === SyncStatus.ERROR)) {
      syncAll();
    }
  };
  
  const iconSize = {
    small: 16,
    medium: 24,
    large: 32
  }[size];
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1 
      }}
    >
      <Tooltip title={tooltip}>
        <IconButton 
          onClick={handleSyncClick}
          disabled={syncStatus === SyncStatus.SYNCING || (!hasPendingChanges && syncStatus !== SyncStatus.ERROR)}
          size={size}
          aria-label={text}
        >
          {React.cloneElement(icon as React.ReactElement, { 
            style: { width: iconSize, height: iconSize } 
          })}
        </IconButton>
      </Tooltip>
      
      {showText && (
        <Typography 
          variant={size === 'small' ? 'caption' : 'body2'} 
          color="textSecondary"
        >
          {text}
        </Typography>
      )}
    </Box>
  );
};

export default SyncStatusIndicator;
