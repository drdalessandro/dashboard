import React, { useState, useEffect } from 'react';
import { Box, Typography, Badge, Chip, Tooltip, IconButton, Menu, MenuItem, CircularProgress } from '@mui/material';
import {
  CloudOff as CloudOffIcon,
  Cloud as CloudIcon,
  CloudSync as CloudSyncIcon,
  CloudDone as CloudDoneIcon,
  Refresh as RefreshIcon,
  WarningAmber as WarningIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { SyncStatus } from '@/data/models/base';

// Import the SyncManager singleton
import { syncManager } from '@/utils/SyncManager';

// No need to initialize a new instance since we're importing the singleton

interface OfflineIndicatorProps {
  showDetails?: boolean;
  variant?: 'icon' | 'chip' | 'badge';
  size?: 'small' | 'medium'; // MUI Chip only supports 'small' and 'medium'
}

/**
 * OfflineIndicator Component
 * 
 * Displays the current offline/online status of the application and sync state
 * Integrates with SyncManager to show real-time connection and synchronization status
 */
export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  showDetails = true,
  variant = 'chip',
  size = 'medium',
}) => {
  const { t } = useTranslation(['offline', 'common']);

  // State to track connection status
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.SYNCED);
  const [pendingChanges, setPendingChanges] = useState<number>(0);
  const [failedChanges, setFailedChanges] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // State for menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Event handlers
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (failedChanges > 0 || pendingChanges > 0) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleRetryAll = () => {
    syncManager.retryAllFailedOperations();
    handleClose();
  };

  const handleForceSync = () => {
    if (isOnline) {
      setIsSyncing(true);
      syncManager.forceSyncAll()
        .then(() => {
          // No need to update status here as it will come from events
        })
        .catch((error: unknown) => {
          console.error('Force sync failed:', error instanceof Error ? error.message : String(error));
        })
        .finally(() => {
          setIsSyncing(false);
        });
    }
    handleClose();
  };

  // Effect to initialize status and listen for changes
  useEffect(() => {
    // Always initialize SyncManager - the method checks internally if it's already initialized
    syncManager.initialize().catch((err: unknown) =>
      console.error('Failed to initialize SyncManager:', err instanceof Error ? err.message : String(err))
    );

    // Update the initial status
    updateSyncStatus();

    // Event handlers for online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Event handler for sync status changes
    const handleSyncStatusChanged = (event: CustomEvent<{
      status?: SyncStatus;
      pendingChanges?: number;
      failedChanges?: number;
    }>) => {
      const detail = event.detail || {};
      setSyncStatus(detail.status || SyncStatus.SYNCED);
      setPendingChanges(detail.pendingChanges || 0);
      setFailedChanges(detail.failedChanges || 0);
    };

    // Event handler for sync completion
    const handleSyncCompleted = () => {
      updateSyncStatus();
      setIsSyncing(false);
    };

    // Event handler for sync started
    const handleSyncStarted = () => {
      setIsSyncing(true);
    };

    // Register event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('syncStatusChanged', handleSyncStatusChanged as EventListener);
    window.addEventListener('syncCompleted', handleSyncCompleted as EventListener);
    window.addEventListener('syncStarted', handleSyncStarted as EventListener);

    // Clean up event listeners on component unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('syncStatusChanged', handleSyncStatusChanged as EventListener);
      window.removeEventListener('syncCompleted', handleSyncCompleted as EventListener);
      window.removeEventListener('syncStarted', handleSyncStarted as EventListener);
    };
  }, []);

  // Function to get the current sync status
  const updateSyncStatus = () => {
    const status = syncManager.getSyncStatus();
    setSyncStatus(status.status);
    setPendingChanges(status.pendingChangesCount);
    setFailedChanges(status.failedChangesCount);
    setLastSyncTime(status.lastSyncTime);
    setIsOnline(status.isOnline);
  };

  // Function to get the appropriate icon
  const getStatusIcon = () => {
    if (!isOnline) return <CloudOffIcon color="action" />;
    if (isSyncing) return <CloudSyncIcon color="primary" />;
    if (failedChanges > 0) return <WarningIcon color="error" />;
    if (pendingChanges > 0) return <CloudSyncIcon color="warning" />;
    return <CloudDoneIcon color="success" />;
  };

  // Function to get status text
  const getStatusText = (): string => {
    if (!isOnline) return t('status.offline', { ns: 'offline' });
    if (isSyncing) return t('status.syncing', { ns: 'offline' });
    if (failedChanges > 0) return t('status.syncFailed', { count: failedChanges, ns: 'offline' });
    if (pendingChanges > 0) return t('status.pendingChanges', { count: pendingChanges, ns: 'offline' });
    return t('status.synced', { ns: 'offline' });
  };

  // Function to get status color
  const getStatusColor = (): string => {
    if (!isOnline) return 'default';
    if (failedChanges > 0) return 'error';
    if (pendingChanges > 0) return 'warning';
    return 'success';
  };

  // Last sync time formatted
  const formattedLastSyncTime = lastSyncTime
    ? new Date(lastSyncTime).toLocaleTimeString()
    : t('status.never', { ns: 'offline' });

  // Tooltip title
  const tooltipTitle = (
    <Box>
      <Typography variant="body2">{getStatusText()}</Typography>
      {isOnline && (
        <Typography variant="caption">
          {t('lastSync', { ns: 'offline' })}: {formattedLastSyncTime}
        </Typography>
      )}
      {(pendingChanges > 0 || failedChanges > 0) && (
        <Typography variant="caption" display="block">
          {t('clickForOptions', { ns: 'offline' })}
        </Typography>
      )}
    </Box>
  );

  // Render based on variant
  if (variant === 'icon') {
    return (
      <Tooltip title={tooltipTitle}>
        <IconButton
          size={size || 'medium'}
          color={isOnline ? "primary" : "default"}
          onClick={handleClick}
          disabled={!isOnline && pendingChanges === 0 && failedChanges === 0}
        >
          {isSyncing ? (
            <CircularProgress size={24} color="primary" />
          ) : (
            getStatusIcon()
          )}
        </IconButton>
      </Tooltip>
    );
  }

  if (variant === 'badge') {
    return (
      <Tooltip title={tooltipTitle}>
        <Badge
          badgeContent={pendingChanges + failedChanges}
          color={failedChanges > 0 ? "error" : "warning"}
          invisible={pendingChanges + failedChanges === 0}
          overlap="circular"
        >
          <IconButton
            size={size || 'medium'}
            color={isOnline ? "primary" : "default"}
            onClick={handleClick}
            disabled={!isOnline && pendingChanges === 0 && failedChanges === 0}
          >
            {isSyncing ? (
              <CircularProgress size={24} color="primary" />
            ) : (
              getStatusIcon()
            )}
          </IconButton>
        </Badge>
      </Tooltip>
    );
  }

  // Default is chip
  return (
    <>
      <Tooltip title={tooltipTitle}>
        <Chip
          icon={isSyncing ? <CircularProgress size={16} color="inherit" /> : getStatusIcon()}
          label={showDetails ? getStatusText() : undefined}
          color={getStatusColor() as any}
          size={size || 'medium'}
          onClick={handleClick}
          variant={isOnline ? "filled" : "outlined"}
          disabled={!isOnline && pendingChanges === 0 && failedChanges === 0}
        />
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        {[
          <MenuItem key="sync-status" disabled>
            <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 200 }}>
              <Typography variant="body2" fontWeight="bold">
                {t('offline.syncStatus')}
              </Typography>
              <Typography variant="caption">
                {t('offline.pendingChanges')}: {pendingChanges}
              </Typography>
              <Typography variant="caption">
                {t('offline.failedOperations')}: {failedChanges}
              </Typography>
              <Typography variant="caption">
                {t('offline.lastSync')}: {formattedLastSyncTime}
              </Typography>
            </Box>
          </MenuItem>,
          <MenuItem key="force-sync" onClick={handleForceSync} disabled={!isOnline || isSyncing}>
            <RefreshIcon fontSize="small" sx={{ mr: 1 }} />
            {t('actions.forceSync', { ns: 'offline' })}
          </MenuItem>,
          ...(failedChanges > 0 ? [
            <MenuItem key="retry-failed" onClick={handleRetryAll} disabled={!isOnline || isSyncing}>
              <WarningIcon fontSize="small" color="error" sx={{ mr: 1 }} />
              {t('actions.retryFailed', { ns: 'offline' })}
            </MenuItem>
          ] : [])
        ]}
      </Menu>
    </>
  );
};

export default OfflineIndicator;
