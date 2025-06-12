// src/components/ui/NetworkStatusIndicator.tsx
// Component to show network and sync status

import React from 'react';
import { useSyncStatus } from '../../utils/SyncManager';
import { SyncStatus } from '../../data/models/base';
import { useTranslation } from 'react-i18next';

type NetworkStatusIndicatorProps = {
  showDetails?: boolean;
  className?: string;
};

/**
 * NetworkStatusIndicator
 * Displays the current network connectivity and sync status
 * Can be used in the header/footer or as a toast notification
 */
export const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  showDetails = false,
  className = '',
}) => {
  const { t } = useTranslation(['network']);
  const { status, lastSyncTime, pendingChangesCount, syncPendingChanges } = useSyncStatus();

  const getStatusColor = () => {
    switch (status) {
      case SyncStatus.SYNCED:
        return 'text-green-500';
      case SyncStatus.PENDING:
        return 'text-amber-500';
      case SyncStatus.OFFLINE:
        return 'text-red-500';
      case SyncStatus.ERROR:
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case SyncStatus.SYNCED:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case SyncStatus.PENDING:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-spin" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        );
      case SyncStatus.OFFLINE:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case SyncStatus.ERROR:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getStatusText = () => {
    switch (status) {
      case SyncStatus.SYNCED:
        return t('status.synced', { ns: 'network' });
      case SyncStatus.PENDING:
        return t('status.pending', { count: pendingChangesCount, ns: 'network' });
      case SyncStatus.OFFLINE:
        return t('status.offline', { ns: 'network' });
      case SyncStatus.ERROR:
        return t('status.error', { ns: 'network' });
      default:
        return t('status.unknown', { ns: 'network' });
    }
  };

  const formatLastSyncTime = () => {
    if (!lastSyncTime) return t('lastSync.never', { ns: 'network' });

    const lastSync = new Date(lastSyncTime);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return t('lastSync.justNow', { ns: 'network' });
    } else if (diffInMinutes < 60) {
      return t('lastSync.minutesAgo', { minutes: diffInMinutes, ns: 'network' });
    } else if (diffInMinutes < 24 * 60) {
      const hours = Math.floor(diffInMinutes / 60);
      return t('lastSync.hoursAgo', { hours, ns: 'network' });
    } else {
      const days = Math.floor(diffInMinutes / (24 * 60));
      return t('lastSync.daysAgo', { days, ns: 'network' });
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      <span className={`flex items-center ${getStatusColor()}`}>
        {getStatusIcon()}
        {showDetails && (
          <div className="ml-2 flex flex-col">
            <span className="text-sm font-medium">{getStatusText()}</span>
            <span className="text-xs text-gray-500">
              {t('lastSync.label', { ns: 'network' })}: {formatLastSyncTime()}
            </span>
            {status === SyncStatus.PENDING && (
              <button
                onClick={() => syncPendingChanges()}
                className="text-xs text-blue-600 hover:text-blue-800 underline mt-1"
              >
                {t('sync.manual', { ns: 'network' })}
              </button>
            )}
          </div>
        )}
      </span>
    </div>
  );
};

export default NetworkStatusIndicator;
