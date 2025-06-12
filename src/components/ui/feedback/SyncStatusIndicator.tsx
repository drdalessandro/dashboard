// src/components/ui/feedback/SyncStatusIndicator.tsx
import React from 'react';
import { Box, Typography, Tooltip, Badge, useTheme } from '@mui/material';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useTranslation } from 'react-i18next';
import { syncService } from '../../../core/services/syncService';
import { useNetworkStatus } from '../../../core/hooks/useNetworkStatus';

interface SyncStatusIndicatorProps {
  showText?: boolean;
  size?: 'small' | 'medium' | 'large';
  position?: 'fixed' | 'absolute' | 'relative';
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Component to display the current synchronization status
 * Shows network status, pending sync items, and sync progress
 */
export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  showText = false,
  size = 'medium',
  position = 'relative',
  className,
  style
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { isOnline, wasOffline } = useNetworkStatus();
  
  // Get sync information
  const pendingSyncCount = syncService.getPendingSyncCount();
  const isSyncInProgress = syncService.isSyncInProgress();
  const lastSyncTimestamp = syncService.getLastSyncTimestamp();
  
  // Determine icon size based on prop
  const iconSize = {
    small: 18,
    medium: 24,
    large: 32
  }[size];
  
  // Format last sync time if available
  const lastSyncTime = lastSyncTimestamp 
    ? new Date(lastSyncTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : t('common.syncStatus.never');
  
  // Determine status and color
  let statusText = '';
  let statusIcon = null;
  let statusColor = '';
  
  if (!isOnline) {
    statusText = t('common.syncStatus.offline');
    statusIcon = <WifiOffIcon fontSize="inherit" />;
    statusColor = theme.palette.warning.main;
  } else if (isSyncInProgress) {
    statusText = t('common.syncStatus.syncing');
    statusIcon = <SyncIcon fontSize="inherit" className="rotating-icon" />;
    statusColor = theme.palette.info.main;
  } else if (pendingSyncCount > 0) {
    statusText = t('common.syncStatus.pendingSync', { count: pendingSyncCount });
    statusIcon = (
      <Badge
        badgeContent={pendingSyncCount > 99 ? '99+' : pendingSyncCount}
        color="error"
        sx={{ 
          '& .MuiBadge-badge': { 
            fontSize: size === 'small' ? '0.6rem' : '0.7rem',
            height: size === 'small' ? 14 : 16
          } 
        }}
      >
        <SyncIcon fontSize="inherit" />
      </Badge>
    );
    statusColor = theme.palette.warning.main;
  } else if (wasOffline) {
    statusText = t('common.syncStatus.syncedAfterOffline', { time: lastSyncTime });
    statusIcon = <CheckCircleIcon fontSize="inherit" />;
    statusColor = theme.palette.success.main;
  } else {
    statusText = t('common.syncStatus.synced', { time: lastSyncTime });
    statusIcon = <WifiIcon fontSize="inherit" />;
    statusColor = theme.palette.success.main;
  }
  
  // Full tooltip text with details
  const tooltipText = `
    ${isOnline ? t('common.syncStatus.online') : t('common.syncStatus.offline')}
    ${pendingSyncCount > 0 ? t('common.syncStatus.pendingSync', { count: pendingSyncCount }) : ''}
    ${t('common.syncStatus.lastSync')}: ${lastSyncTime}
  `.trim();

  return (
    <Tooltip title={tooltipText} arrow>
      <Box
        className={className}
        sx={{
          display: 'flex',
          alignItems: 'center',
          position,
          ...(position === 'fixed' && {
            bottom: 16,
            right: 16,
            zIndex: 1000,
            p: 1,
            borderRadius: 1,
            backgroundColor: 'background.paper',
            boxShadow: 1
          }),
          ...style
        }}
      >
        <Box 
          sx={{ 
            color: statusColor,
            fontSize: iconSize,
            display: 'flex',
            alignItems: 'center',
            animation: isSyncInProgress ? 'spin 2s linear infinite' : 'none',
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' }
            }
          }}
        >
          {statusIcon}
        </Box>
        
        {showText && (
          <Typography 
            variant={size === 'small' ? 'caption' : 'body2'} 
            color="textSecondary"
            sx={{ ml: 1 }}
          >
            {statusText}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
};

export default SyncStatusIndicator;
